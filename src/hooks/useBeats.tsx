
import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';
import { applyFilters } from '@/utils/beatsFilterUtils';
import { 
  CACHE_KEYS, CACHE_DURATIONS, 
  loadFromCache, saveToCache, checkShouldRefreshCache, isOnline 
} from '@/utils/beatsCacheUtils';
import { 
  refreshTrendingBeats, refreshWeeklyPicks, selectFeaturedBeat 
} from '@/utils/beatsTrendingUtils';
import { 
  fetchAllBeats, fetchTrendingBeats, fetchRandomBeats, fetchNewBeats,
  fetchUserFavorites, fetchPurchasedBeats, fetchPurchasedBeatDetails, 
  toggleFavoriteAPI, fetchBeatById, getProducerBeats as getProducerBeatsService,
  getUserFavoriteBeats as getUserFavoriteBeatsService,
  clearBeatsCache
} from '@/services/beats';

// Request throttling constants
const MIN_REQUEST_INTERVAL = 3000; // 3 seconds between fetch attempts
const MAX_RETRIES_BEFORE_COOLDOWN = 3;
const COOLDOWN_PERIOD = 30000; // 30 seconds after hitting max retries

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [popularBeats, setPopularBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const { user, currency } = useAuth();
  const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);
  const [filteredBeats, setFilteredBeats] = useState<Beat[]>([]);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);
  const [fetchInProgress, setFetchInProgress] = useState(false);
  const [dataFetched, setDataFetched] = useState<boolean>(false);
  
  // New state for request throttling
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [inCooldown, setInCooldown] = useState(false);

  const fetchUserFavoritesData = useCallback(async () => {
    if (!user) return;
    
    try {
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        setUserFavorites(cachedFavorites);
        return;
      }
      
      const favorites = await fetchUserFavorites(user.id);
      setUserFavorites(favorites);
      
      if (favorites.length < 100) {
        localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        setUserFavorites(cachedFavorites);
      }
    }
  }, [user]);

  const fetchPurchasedBeatsData = useCallback(async () => {
    if (!user) return;
    
    try {
      const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchases) {
        setPurchasedBeats(cachedPurchases);
        return;
      }
      
      const purchasedIds = await fetchPurchasedBeats(user.id);
      setPurchasedBeats(purchasedIds);
      
      localStorage.setItem(CACHE_KEYS.USER_PURCHASES, JSON.stringify(purchasedIds));
      
      if (purchasedIds.length > 0 && beats.length === 0) {
        const purchasedBeatsDetails = await fetchPurchasedBeatDetails(purchasedIds);
        
        if (purchasedBeatsDetails.length > 0) {
          setBeats(prevBeats => {
            const existingIds = new Set(prevBeats.map(b => b.id));
            const newBeats = purchasedBeatsDetails.filter(b => !existingIds.has(b.id));
            return [...prevBeats, ...newBeats];
          });
        }
      }
    } catch (error) {
      console.error('Error fetching purchased beats:', error);
      
      const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchases) {
        setPurchasedBeats(cachedPurchases);
      }
    }
  }, [user, beats.length]);

  const checkNetworkAndRetry = useCallback(async () => {
    if (!isOnline()) {
      setIsOffline(true);
      return false;
    }
    
    setIsOffline(false);
    return true;
  }, []);
  
  const handleNoBeatsFound = useCallback(() => {
    console.log('No beats found in the database, showing empty state');
    
    setBeats([]);
    setTrendingBeats([]);
    setNewBeats([]);
    setFeaturedBeat(null);
    setWeeklyPicks([]);
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server.');
  }, []);

  const fetchInitialBeats = useCallback(async () => {
    if (trendingBeats.length > 0) return; // Skip if we already have trending beats
    
    try {
      const initialBeats = await fetchTrendingBeats(10);
      if (initialBeats && initialBeats.length > 0) {
        setTrendingBeats(initialBeats);
      }
      
      const initialNewBeats = await fetchNewBeats(10); 
      if (initialNewBeats && initialNewBeats.length > 0) {
        setNewBeats(initialNewBeats);
      }
      
      const initialWeeklyPicks = await fetchRandomBeats(4);
      if (initialWeeklyPicks && initialWeeklyPicks.length > 0) {
        setWeeklyPicks(initialWeeklyPicks);
      }
      
      if (initialBeats && initialBeats.length > 0) {
        const featured = { ...initialBeats[0], is_featured: true };
        setFeaturedBeat(featured);
      }
      
      setIsLoading(false);
      
    } catch (error) {
      console.error('Error fetching initial beats:', error);
      setIsLoading(false);
    }
  }, [trendingBeats.length]);

  const fetchBeats = useCallback(async (options?: { skipCache?: boolean }) => {
    // Check if we're in cooldown period
    if (inCooldown) {
      console.log('In cooldown period, skipping fetch');
      return;
    }
    
    // Throttle requests - don't allow more than one request every MIN_REQUEST_INTERVAL ms
    const now = Date.now();
    if (now - lastFetchTime < MIN_REQUEST_INTERVAL && !options?.skipCache) {
      console.log(`Request too soon (${now - lastFetchTime}ms since last request), throttling`);
      // We'll skip this request because it's too soon after the previous one
      return;
    }
    
    if (fetchInProgress) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    if (dataFetched && beats.length > 0 && !options?.skipCache) {
      console.log('Data already fetched, using cached beats');
      setIsLoading(false);
      return;
    }
    
    // Update the last fetch time
    setLastFetchTime(now);
    
    if (user?.role === 'producer') {
      try {
        const skipCache = options?.skipCache === true;
        
        if (!skipCache) {
          const cachedBeats = loadFromCache<Beat[]>(`producer_beats_${user.id}`);
          if (cachedBeats) {
            console.log('Using cached producer beats');
            setBeats(cachedBeats);
            setIsLoading(false);
            setDataFetched(true);
            return;
          }
        } else {
          console.log('Bypassing producer beats cache as requested');
        }
        
        const producerBeatsQuery = await fetchAllBeats({ 
          includeDrafts: true, 
          producerId: user.id, 
          limit: 50,
          skipCache: skipCache
        });
        
        if (producerBeatsQuery && producerBeatsQuery.length > 0) {
          setBeats(producerBeatsQuery);
          setIsLoading(false);
          setDataFetched(true);
          
          // Reset retry count on success
          setRetryCount(0);
          
          if (!skipCache) {
            localStorage.setItem(`producer_beats_${user.id}`, JSON.stringify(producerBeatsQuery));
          }
          return;
        }
      } catch (error) {
        console.error('Error fetching producer beats:', error);
        incrementRetryCount();
      }
    }
    
    const shouldRefresh = options?.skipCache || checkShouldRefreshCache(CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
    
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (cachedBeats && !shouldRefresh) {
      console.log('Using cached beats data');
      setBeats(cachedBeats);
      setIsLoading(false);
      setDataFetched(true);
      return;
    }
    
    setFetchInProgress(true);
    setLoadingError(null);
    
    if (!await checkNetworkAndRetry()) {
      setFetchInProgress(false);
      return;
    }
    
    console.log('Fetching all beats from API...');
    
    try {
      if (trendingBeats.length === 0) {
        await fetchInitialBeats();
      }
      
      const transformedBeats = await fetchAllBeats({ 
        includeDrafts: true,
        limit: 50
      });
      
      if (!transformedBeats || transformedBeats.length === 0) {
        console.warn("No beats returned from API");
        handleNoBeatsFound();
        setFetchInProgress(false);
        incrementRetryCount();
        return;
      }
      
      // Success! Reset retry count
      setRetryCount(0);
      
      setBeats(transformedBeats);
      
      const shouldRefreshTrending = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefreshTrending || trendingBeats.length === 0) {
        setTrendingBeats(refreshTrendingBeats(transformedBeats));
      }
      
      const shouldRefreshFeatured = checkShouldRefreshCache(CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      if (shouldRefreshFeatured || !featuredBeat) {
        setFeaturedBeat(selectFeaturedBeat(transformedBeats));
      }
      
      const shouldRefreshWeekly = checkShouldRefreshCache(CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      if (shouldRefreshWeekly || weeklyPicks.length === 0) {
        setWeeklyPicks(refreshWeeklyPicks(transformedBeats));
      }
      
      const sortedByNew = [...transformedBeats].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNewBeats(sortedByNew.slice(0, 5));
      
      if (activeFilters) {
        setFilteredBeats(applyFilters(transformedBeats, activeFilters));
      } else {
        setFilteredBeats(transformedBeats);
      }
      
      setLoadingError(null);
      setIsOffline(false);
      setDataFetched(true);
      
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      
      if (trendingBeats.length === 0) {
        await fetchInitialBeats();
      }
      
      incrementRetryCount();
      setLoadingError(`Failed to load complete beat collection: ${error.message || 'Unknown error'}`);
    } finally {
      setFetchInProgress(false);
      setIsLoading(false);
    }
  }, [user, activeFilters, checkNetworkAndRetry, handleNoBeatsFound, 
      fetchInitialBeats, fetchUserFavoritesData, fetchPurchasedBeatsData, 
      trendingBeats.length, weeklyPicks.length, featuredBeat, 
      fetchInProgress, beats.length, dataFetched, lastFetchTime, inCooldown]);

  // Helper function to manage retry counts and cooldown
  const incrementRetryCount = useCallback(() => {
    setRetryCount(prev => {
      const newCount = prev + 1;
      // If we hit the max retries, go into cooldown
      if (newCount >= MAX_RETRIES_BEFORE_COOLDOWN) {
        console.log(`Hit max retries (${MAX_RETRIES_BEFORE_COOLDOWN}), entering cooldown period`);
        setInCooldown(true);
        
        // Set a timeout to exit cooldown
        setTimeout(() => {
          console.log('Exiting cooldown period');
          setInCooldown(false);
          setRetryCount(0);
        }, COOLDOWN_PERIOD);
      }
      return newCount;
    });
  }, []);

  const forceRefreshBeats = useCallback(async () => {
    console.log("Force refreshing beats data...");
    
    // Reset retry count and cooldown when manually refreshing
    setRetryCount(0);
    setInCooldown(false);
    
    if (user?.role === 'producer') {
      localStorage.removeItem(`producer_beats_${user.id}`);
    }
    
    clearBeatsCache();
    
    setDataFetched(false);
    
    await fetchBeats({ skipCache: true });
    
    console.log("Beats data refreshed");
  }, [fetchBeats, user]);

  useEffect(() => {
    if (!dataFetched) {
      fetchInitialBeats();
      fetchBeats();
    }
    
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("You're back online!");
      // Try refetching data when coming back online
      if (!dataFetched || beats.length === 0) {
        fetchBeats();
      }
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline. Using cached content.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dataFetched, fetchInitialBeats, fetchBeats, beats.length]);

  const updateFilters = (newFilters: FilterValues) => {
    setActiveFilters(newFilters);
    if (beats.length > 0) {
      const filtered = applyFilters(beats, newFilters);
      setFilteredBeats(filtered);
    }
  };

  const clearFilters = () => {
    setActiveFilters(null);
    setFilteredBeats(beats);
  };

  const toggleFavorite = async (beatId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return false;
    }

    try {
      const isFav = userFavorites.includes(beatId);
      
      const updatedFavorites = isFav
        ? userFavorites.filter(id => id !== beatId)
        : [...userFavorites, beatId];
        
      setUserFavorites(updatedFavorites);
      
      if (isFav) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
      
      try {
        await toggleFavoriteAPI(user.id, beatId, userFavorites);
        
        localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(updatedFavorites));
        
        return !isFav;
      } catch (error) {
        setUserFavorites(userFavorites);
        toast.error('Failed to update favorites');
        console.error('Error updating favorites:', error);
        return isFav;
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      toast.error('Something went wrong');
      return userFavorites.includes(beatId);
    }
  };

  const isFavorite = (beatId: string): boolean => {
    return userFavorites.includes(beatId);
  };

  const isPurchased = (beatId: string): boolean => {
    return purchasedBeats.includes(beatId);
  };
  
  const getBeatById = async (id: string): Promise<Beat | null> => {
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (cachedBeats) {
      const cachedBeat = cachedBeats.find(beat => beat.id === id);
      if (cachedBeat) return cachedBeat;
    }
    
    return fetchBeatById(id);
  };
  
  const getUserPurchasedBeats = (): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  const getUserFavoriteBeats = (): Beat[] => {
    return getUserFavoriteBeatsService(beats, userFavorites);
  };

  const getProducerBeats = (producerId: string): Beat[] => {
    return getProducerBeatsService(beats, producerId);
  };
  
  return {
    beats,
    filteredBeats,
    trendingBeats,
    popularBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading,
    loadingError,
    updateFilters,
    clearFilters,
    fetchBeats,
    toggleFavorite,
    isFavorite,
    isPurchased,
    fetchUserFavorites: fetchUserFavoritesData,
    fetchPurchasedBeats: fetchPurchasedBeatsData,
    userFavorites,
    purchasedBeats,
    isOffline,
    activeFilters,
    getBeatById,
    getUserPurchasedBeats,
    getUserFavoriteBeats,
    getProducerBeats,
    fetchInProgress,
    forceRefreshBeats,
    dataFetched
  };
}
