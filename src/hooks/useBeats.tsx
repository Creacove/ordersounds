
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

  const fetchUserFavoritesData = useCallback(async (forceRefresh = false) => {
    if (!user) return;
    
    console.log('Fetching user favorites data...', { forceRefresh });
    
    try {
      // Clear cache if forcing refresh
      if (forceRefresh) {
        localStorage.removeItem(CACHE_KEYS.USER_FAVORITES);
        console.log('Cleared favorites cache');
      }
      
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites && !forceRefresh) {
        console.log('Using cached favorites:', cachedFavorites);
        setUserFavorites(cachedFavorites);
        return;
      }
      
      const favorites = await fetchUserFavorites(user.id);
      console.log('Fetched favorites from API:', favorites);
      setUserFavorites(favorites);
      
      if (favorites.length < 100) {
        localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(favorites));
        console.log('Saved favorites to cache');
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        console.log('Using cached favorites due to error:', cachedFavorites);
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
    if (fetchInProgress) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    if (dataFetched && beats.length > 0 && !options?.skipCache) {
      console.log('Data already fetched, using cached beats');
      setIsLoading(false);
      return;
    }
    
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
          
          if (!skipCache) {
            localStorage.setItem(`producer_beats_${user.id}`, JSON.stringify(producerBeatsQuery));
          }
          return;
        }
      } catch (error) {
        console.error('Error fetching producer beats:', error);
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
        return;
      }
      
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
      
      setLoadingError(`Failed to load complete beat collection: ${error.message || 'Unknown error'}`);
    } finally {
      setFetchInProgress(false);
      setIsLoading(false);
    }
  }, [user, activeFilters, checkNetworkAndRetry, handleNoBeatsFound, 
      fetchInitialBeats, fetchUserFavoritesData, fetchPurchasedBeatsData, 
      trendingBeats.length, weeklyPicks.length, featuredBeat, 
      fetchInProgress, beats.length, dataFetched]);

  const forceRefreshBeats = useCallback(async () => {
    console.log("Force refreshing beats data...");
    
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
  }, [dataFetched, fetchInitialBeats, fetchBeats]);

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

    console.log('Toggle favorite called for beat:', beatId);
    console.log('Current favorites before toggle:', userFavorites);

    const originalFavorites = [...userFavorites]; // Store original state
    const wasFavorited = originalFavorites.includes(beatId);
    
    try {
      // Optimistic update
      const optimisticFavorites = wasFavorited
        ? originalFavorites.filter(id => id !== beatId)
        : [...originalFavorites, beatId];
        
      console.log('Optimistic favorites update:', optimisticFavorites);
      setUserFavorites(optimisticFavorites);
      
      // Show immediate feedback
      if (wasFavorited) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
      
      // Make API call
      const updatedFavorites = await toggleFavoriteAPI(user.id, beatId, originalFavorites);
      console.log('API returned favorites:', updatedFavorites);
      
      // Update with actual API response
      setUserFavorites(updatedFavorites);
      
      // Clear cache to ensure fresh data
      localStorage.removeItem(CACHE_KEYS.USER_FAVORITES);
      console.log('Cleared favorites cache after successful toggle');
      
      // Update cache with new data
      localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(updatedFavorites));
      console.log('Updated favorites cache with new data');
      
      const newFavoriteStatus = updatedFavorites.includes(beatId);
      console.log('New favorite status for beat:', beatId, newFavoriteStatus);
      
      return newFavoriteStatus;
    } catch (error) {
      console.error('Error updating favorites:', error);
      
      // Revert to original state on error
      console.log('Reverting to original favorites due to error:', originalFavorites);
      setUserFavorites(originalFavorites);
      
      toast.error('Failed to update favorites');
      return wasFavorited;
    }
  };

  const isFavorite = (beatId: string): boolean => {
    const result = userFavorites.includes(beatId);
    console.log('Checking if beat is favorite:', beatId, result, 'Current favorites:', userFavorites);
    return result;
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
    console.log('Getting user favorite beats:', userFavorites);
    const favoriteBeats = getUserFavoriteBeatsService(beats, userFavorites);
    console.log('Favorite beats found:', favoriteBeats);
    return favoriteBeats;
  };

  const getProducerBeats = (producerId: string): Beat[] => {
    return getProducerBeatsService(beats, producerId);
  };

  // New function to refresh favorites specifically
  const refreshUserFavorites = useCallback(async () => {
    console.log('Refreshing user favorites...');
    await fetchUserFavoritesData(true);
  }, [fetchUserFavoritesData]);
  
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
    refreshUserFavorites,
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
