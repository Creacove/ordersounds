
import { useState, useEffect, useCallback, useRef } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';
import { applyFilters } from '@/utils/beatsFilterUtils';
import { 
  CACHE_KEYS, CACHE_DURATIONS, 
  loadFromCache, saveToCache, checkShouldRefreshCache, isOnline,
  optimizeCacheStorage
} from '@/utils/beatsCacheUtils';
import { 
  refreshTrendingBeats, refreshWeeklyPicks, selectFeaturedBeat 
} from '@/utils/beatsTrendingUtils';
import {
  prioritizeNetworkRequests, hasSufficientCachedData,
  getSortedFallbackBeats, LOADING_TIMEOUT
} from '@/utils/beatsOptimizer';
import { 
  fallbackBeats, fetchAllBeats, fetchTrendingBeats,
  fetchPopularBeats, fetchUserFavorites, fetchPurchasedBeats,
  fetchPurchasedBeatDetails, toggleFavoriteAPI, fetchBeatById,
  getProducerBeats, getUserFavoriteBeats
} from '@/services/beatsService';

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
  const [retryCount, setRetryCount] = useState(0);
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);
  
  const loadingTimerRef = useRef<number | null>(null);
  const isDataInitializedRef = useRef<boolean>(false);

  // Initialize with cached data first for faster initial rendering
  useEffect(() => {
    const initializeFromCache = () => {
      // Prioritize network resources
      prioritizeNetworkRequests();
      
      // Load cached data for faster initial render
      const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
      const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
      const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS);
      const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS);
      
      if (cachedBeats && cachedBeats.length > 0) {
        setBeats(cachedBeats);
        
        // Preload trending if available
        if (cachedTrending && cachedTrending.length > 0) {
          setTrendingBeats(cachedTrending);
        } else {
          // Generate trending from cached beats as fallback
          setTrendingBeats(refreshTrendingBeats(cachedBeats));
        }
        
        // Set featured beat
        if (cachedFeatured) {
          setFeaturedBeat(cachedFeatured);
        } else if (cachedTrending && cachedTrending.length > 0) {
          setFeaturedBeat({...cachedTrending[0], is_featured: true});
        } else if (cachedBeats.length > 0) {
          setFeaturedBeat({...cachedBeats[0], is_featured: true});
        }
        
        // Sort by newest for new beats section
        const sortedByNew = [...cachedBeats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewBeats(sortedByNew);
        
        // Set weekly picks if available or generate from cache
        if (cachedWeekly && cachedWeekly.length > 0) {
          setWeeklyPicks(cachedWeekly);
        } else {
          setWeeklyPicks(refreshWeeklyPicks(cachedBeats));
        }
        
        // Don't set loading to false yet, but show cached data while loading fresh data
        isDataInitializedRef.current = true;
      }
    };
    
    initializeFromCache();
  }, []);

  // Declare fetchUserFavoritesData and fetchPurchasedBeatsData before referencing them
  const fetchUserFavoritesData = useCallback(async () => {
    if (!user) return;
    
    try {
      const favorites = await fetchUserFavorites(user.id);
      setUserFavorites(favorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  }, [user]);

  const fetchPurchasedBeatsData = useCallback(async () => {
    if (!user) return;
    
    try {
      const purchasedIds = await fetchPurchasedBeats(user.id);
      setPurchasedBeats(purchasedIds);
      
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
    }
  }, [user, beats.length]);

  const checkNetworkAndRetry = useCallback(async () => {
    if (!isOnline()) {
      setIsOffline(true);
      loadFallbackData();
      return false;
    }
    
    setIsOffline(false);
    return true;
  }, []);
  
  const loadFallbackData = useCallback(() => {
    console.log('Loading fallback data');
    
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS) || fallbackBeats;
    const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS) || fallbackBeats;
    const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS) || fallbackBeats[0];
    const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS) || fallbackBeats;
    
    const sortedFallbackBeats = getSortedFallbackBeats(cachedBeats);
    
    setBeats(sortedFallbackBeats);
    setTrendingBeats(cachedTrending);
    setNewBeats(sortedFallbackBeats);
    setFeaturedBeat(cachedFeatured);
    setWeeklyPicks(cachedWeekly);
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server. Using cached or demo content.');
  }, []);

  const fetchBeats = useCallback(async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    // Set a timeout to make sure we show something if the request takes too long
    if (loadingTimerRef.current) window.clearTimeout(loadingTimerRef.current);
    loadingTimerRef.current = window.setTimeout(() => {
      if (!isDataInitializedRef.current && hasSufficientCachedData()) {
        console.log('Loading timeout reached, using cached data');
        loadFallbackData();
      }
    }, LOADING_TIMEOUT) as unknown as number;
    
    if (!await checkNetworkAndRetry()) {
      return;
    }
    
    console.log('Fetching beats from API...');
    
    try {
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 12 seconds")), 12000);
      });
      
      const transformedBeats = await Promise.race([
        fetchAllBeats(),
        timeoutPromise
      ]) as Beat[];
      
      if (!transformedBeats || transformedBeats.length === 0) {
        console.warn("No beats returned from API, using fallback data");
        loadFallbackData();
        return;
      }
      
      saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      setBeats(transformedBeats);
      
      const shouldRefreshTrending = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefreshTrending) {
        const trending = refreshTrendingBeats(transformedBeats);
        setTrendingBeats(trending);
        saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      } else {
        const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
        if (cachedTrending) {
          setTrendingBeats(cachedTrending);
        } else {
          const trending = refreshTrendingBeats(transformedBeats);
          setTrendingBeats(trending);
          saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
        }
      }
      
      const shouldRefreshFeatured = checkShouldRefreshCache(CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      if (shouldRefreshFeatured) {
        const featured = selectFeaturedBeat(transformedBeats);
        setFeaturedBeat(featured);
        saveToCache(CACHE_KEYS.FEATURED_BEATS, featured, CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      } else {
        const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS);
        if (cachedFeatured) {
          setFeaturedBeat(cachedFeatured);
        } else if (trendingBeats.length > 0) {
          const featured = {...trendingBeats[0], is_featured: true};
          setFeaturedBeat(featured);
          saveToCache(CACHE_KEYS.FEATURED_BEATS, featured, CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
        } else {
          setFeaturedBeat(fallbackBeats[0]);
        }
      }
      
      const shouldRefreshWeekly = checkShouldRefreshCache(CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      if (shouldRefreshWeekly) {
        const weekly = refreshWeeklyPicks(transformedBeats);
        setWeeklyPicks(weekly);
        saveToCache(CACHE_KEYS.WEEKLY_PICKS, weekly, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      } else {
        const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS);
        if (cachedWeekly) {
          setWeeklyPicks(cachedWeekly);
        } else {
          const weekly = refreshWeeklyPicks(transformedBeats);
          setWeeklyPicks(weekly);
          saveToCache(CACHE_KEYS.WEEKLY_PICKS, weekly, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
        }
      }
      
      const sortedByNew = [...transformedBeats].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNewBeats(sortedByNew);
      
      if (activeFilters) {
        const filtered = applyFilters(transformedBeats, activeFilters);
        setFilteredBeats(filtered);
      } else {
        setFilteredBeats(transformedBeats);
      }
      
      setIsLoading(false);
      setLoadingError(null);
      setRetryCount(0);
      setIsOffline(false);
      isDataInitializedRef.current = true;
      
      // Optimize the cache storage after successful fetch
      optimizeCacheStorage();
      
      // Clear any loading timer
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
      
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      
      if (retryCount < 2) { // Reduced retry count from 3 to 2 for faster fallback
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchBeats(), 800 * (retryCount + 1)); // Reduced timeout for faster fallback
        return;
      }
      
      loadFallbackData();
      setLoadingError(`Failed to load beats: ${error.message || 'Unknown error'}`);
      
      if (error.message?.includes("timed out")) {
        toast.error('Beat loading timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to load beats. Using cached content.');
      }
      
      // Clear any loading timer
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    }
  }, [user, activeFilters, retryCount, checkNetworkAndRetry, loadFallbackData, fetchPurchasedBeatsData, fetchUserFavoritesData]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      fetchBeats();
      toast.success("You're back online!");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline. Some features may be limited.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clear timeout on unmount
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, [fetchBeats]);

  // Initial data fetching
  useEffect(() => {
    fetchBeats();
    
    // Less frequent refresh for trending data
    const intervalId = setInterval(() => {
      const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefresh && beats.length > 0) {
        const trending = refreshTrendingBeats(beats);
        setTrendingBeats(trending);
        saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      }
    }, 10 * 60 * 1000); // Increased from 5 to 10 minutes for less frequent updates
    
    return () => clearInterval(intervalId);
  }, [fetchBeats, beats]);

  const updateFilters = useCallback((newFilters: FilterValues) => {
    setActiveFilters(newFilters);
    if (beats.length > 0) {
      const filtered = applyFilters(beats, newFilters);
      setFilteredBeats(filtered);
    }
  }, [beats]);

  const clearFilters = useCallback(() => {
    setActiveFilters(null);
    setFilteredBeats(beats);
  }, [beats]);

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

  const isFavorite = useCallback((beatId: string): boolean => {
    return userFavorites.includes(beatId);
  }, [userFavorites]);

  const isPurchased = useCallback((beatId: string): boolean => {
    return purchasedBeats.includes(beatId);
  }, [purchasedBeats]);
  
  const getBeatById = useCallback(async (id: string): Promise<Beat | null> => {
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    return fetchBeatById(id);
  }, [beats]);
  
  const getUserPurchasedBeats = useCallback((): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  }, [beats, purchasedBeats]);

  const getUserFavoriteBeats = useCallback((): Beat[] => {
    return beats.filter(beat => userFavorites.includes(beat.id));
  }, [beats, userFavorites]);

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
    fetchTrendingBeats: async () => {
      const trending = await fetchTrendingBeats();
      setTrendingBeats(trending);
    },
    fetchPopularBeats: async () => {
      if (popularBeats.length > 0) return;
      
      const popular = await fetchPopularBeats();
      setPopularBeats(popular);
    },
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
    getProducerBeats: (producerId: string) => getProducerBeats(beats, producerId),
    getUserPurchasedBeats,
    getUserFavoriteBeats
  };
}
