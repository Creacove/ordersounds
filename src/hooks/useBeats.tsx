
import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';
import { applyFilters } from '@/utils/beatsFilterUtils';
import { 
  CACHE_KEYS, CACHE_DURATIONS, 
  loadFromCache, saveToCache, checkShouldRefreshCache, isOnline,
  shouldForceFreshFetchOnLaunch, getDataFreshnessStatus
} from '@/utils/beatsCacheUtils';
import { 
  refreshTrendingBeats, refreshWeeklyPicks, selectFeaturedBeat 
} from '@/utils/beatsTrendingUtils';
import { 
  fallbackBeats, fetchAllBeats, fetchTrendingBeats,
  fetchPopularBeats, fetchUserFavorites, fetchPurchasedBeats,
  fetchPurchasedBeatDetails, toggleFavoriteAPI, fetchBeatById,
  getProducerBeats
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
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);
  const [dataFreshness, setDataFreshness] = useState<'fresh' | 'stale' | 'expired'>(getDataFreshnessStatus());
  const [fetchInProgress, setFetchInProgress] = useState(false);

  // Declare fetchUserFavoritesData and fetchPurchasedBeatsData before referencing them
  const fetchUserFavoritesData = async () => {
    if (!user) return;
    
    try {
      // First try to load from cache
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        setUserFavorites(cachedFavorites);
        return;
      }

      const favorites = await fetchUserFavorites(user.id);
      setUserFavorites(favorites);
      
      // Save to cache
      if (favorites.length > 0) {
        localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      
      // Try to load from cache as fallback
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        setUserFavorites(cachedFavorites);
      }
    }
  };

  const fetchPurchasedBeatsData = async () => {
    if (!user) return;
    
    try {
      // First try to load from cache
      const cachedPurchased = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchased) {
        setPurchasedBeats(cachedPurchased);
        
        // If we have all beats data already, we're done
        if (beats.length > 0) {
          return;
        }
      }

      const purchasedIds = await fetchPurchasedBeats(user.id);
      setPurchasedBeats(purchasedIds);
      
      // Save to cache
      if (purchasedIds.length > 0) {
        localStorage.setItem(CACHE_KEYS.USER_PURCHASES, JSON.stringify(purchasedIds));
      }
      
      // Only fetch details if we need them and don't have beats data already
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
      
      // Try to load from cache as fallback
      const cachedPurchased = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchased) {
        setPurchasedBeats(cachedPurchased);
      }
    }
  };

  // NEW: Load data from cache immediately
  const loadFromCachedData = useCallback(() => {
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
    const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS);
    const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS);
    
    if (cachedBeats && cachedBeats.length > 0) {
      setBeats(cachedBeats);
      
      // Also set filtered beats if we have filters
      if (activeFilters) {
        setFilteredBeats(applyFilters(cachedBeats, activeFilters));
      } else {
        setFilteredBeats(cachedBeats);
      }
      
      // Set new beats
      const sortedByNew = [...cachedBeats].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNewBeats(sortedByNew);
    }
    
    if (cachedTrending && cachedTrending.length > 0) {
      setTrendingBeats(cachedTrending);
    }
    
    if (cachedFeatured) {
      setFeaturedBeat(cachedFeatured);
    }
    
    if (cachedWeekly && cachedWeekly.length > 0) {
      setWeeklyPicks(cachedWeekly);
    }
    
    // If we loaded anything from cache, we can show it immediately
    const hasLoadedAnyData = 
      (cachedBeats && cachedBeats.length > 0) ||
      (cachedTrending && cachedTrending.length > 0);
      
    if (hasLoadedAnyData) {
      setIsLoading(false);
    }
    
    return !!cachedBeats && cachedBeats.length > 0;
  }, [activeFilters]);

  const checkNetworkAndRetry = async (): Promise<boolean> => {
    if (!isOnline()) {
      setIsOffline(true);
      loadFallbackData();
      return false;
    }
    
    setIsOffline(false);
    return true;
  };
  
  const loadFallbackData = useCallback(() => {
    console.log('Loading fallback data');
    
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS) || fallbackBeats;
    const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS) || fallbackBeats;
    const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS) || fallbackBeats[0];
    const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS) || fallbackBeats;
    
    setBeats(cachedBeats);
    setTrendingBeats(cachedTrending);
    setNewBeats(cachedBeats);
    setFeaturedBeat(cachedFeatured);
    setWeeklyPicks(cachedWeekly);
    
    if (activeFilters) {
      setFilteredBeats(applyFilters(cachedBeats, activeFilters));
    } else {
      setFilteredBeats(cachedBeats);
    }
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server. Using cached or demo content.');
  }, [activeFilters]);

  const fetchBeats = useCallback(async () => {
    // Prevent concurrent fetches
    if (fetchInProgress) {
      console.log('Fetch already in progress, skipping');
      return;
    }
    
    setFetchInProgress(true);
    setIsLoading(true);
    setLoadingError(null);
    
    // First load from cache if available
    const hasCachedData = loadFromCachedData();
    
    // Check if we should actually make a network request
    const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
    const forceRefreshOnLaunch = shouldForceFreshFetchOnLaunch();
    
    // If we have cached data and don't need to refresh, stop here
    if (hasCachedData && !shouldRefresh && !forceRefreshOnLaunch) {
      console.log('Using cached data, no need to fetch');
      setFetchInProgress(false);
      setIsLoading(false);
      return;
    }
    
    // Check network before making API call
    if (!await checkNetworkAndRetry()) {
      setFetchInProgress(false);
      return;
    }
    
    console.log('Fetching beats from API...');
    
    try {
      // Use a very long timeout for initial data load
      const timeoutPromise = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out after 60 seconds")), 60000);
      });
      
      // Make a single request with a long timeout
      const transformedBeats = await Promise.race([
        fetchAllBeats(),
        timeoutPromise
      ]) as Beat[];
      
      // If we don't get any data, use fallback
      if (!transformedBeats || transformedBeats.length === 0) {
        console.warn("No beats returned from API, using fallback data");
        loadFallbackData();
        setFetchInProgress(false);
        return;
      }
      
      // Save all beats to cache with the extended duration
      saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      // Update our state
      setBeats(transformedBeats);
      
      // Generate derived data from the fetched beats
      const trending = refreshTrendingBeats(transformedBeats);
      setTrendingBeats(trending);
      saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      
      const featured = selectFeaturedBeat(transformedBeats);
      setFeaturedBeat(featured);
      saveToCache(CACHE_KEYS.FEATURED_BEATS, featured, CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      
      const weekly = refreshWeeklyPicks(transformedBeats);
      setWeeklyPicks(weekly);
      saveToCache(CACHE_KEYS.WEEKLY_PICKS, weekly, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      
      // Sort by newest
      const sortedByNew = [...transformedBeats].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNewBeats(sortedByNew);
      
      // Apply filters if needed
      if (activeFilters) {
        const filtered = applyFilters(transformedBeats, activeFilters);
        setFilteredBeats(filtered);
      } else {
        setFilteredBeats(transformedBeats);
      }
      
      setIsLoading(false);
      setLoadingError(null);
      setIsOffline(false);
      
      // Update data freshness status
      setDataFreshness('fresh');
      
      // Fetch user-specific data
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
      
      // Show success message for full reload
      if (forceRefreshOnLaunch) {
        toast.success('Fresh content loaded successfully');
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      
      // Do not retry - just use cached or fallback data
      loadFallbackData();
      setLoadingError(`Failed to load beats: ${error.message || 'Unknown error'}`);
      
      if (error.message?.includes("timed out")) {
        toast.error('Content could not be loaded. Please check your connection and refresh the page.');
      } else {
        toast.error('Failed to load fresh content. Using cached content.');
      }
    } finally {
      setFetchInProgress(false);
    }
  }, [user, activeFilters, loadFallbackData, loadFromCachedData]);

  // Listen to online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Don't automatically fetch on reconnect, let the user manually refresh
      // when they need fresh data
      toast.success("You're back online! Tap refresh for new content.");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("You're offline. Using cached content.");
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
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchBeats();
    
    // No more automatic refreshes in the background - 
    // we'll rely on the cache and let the user manually refresh
  }, [fetchBeats]);

  // Update filters
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

  // Toggle favorite functionality
  const toggleFavorite = async (beatId: string): Promise<boolean> => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return false;
    }

    try {
      const isFav = userFavorites.includes(beatId);
      
      // Optimistically update UI
      const updatedFavorites = isFav
        ? userFavorites.filter(id => id !== beatId)
        : [...userFavorites, beatId];
        
      setUserFavorites(updatedFavorites);
      
      // Update cache immediately
      localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(updatedFavorites));
      
      if (isFav) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
      
      try {
        // Make API call in the background
        await toggleFavoriteAPI(user.id, beatId, userFavorites);
        return !isFav;
      } catch (error) {
        // Revert UI if API call fails
        setUserFavorites(userFavorites);
        localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(userFavorites));
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
    // First check local memory
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    // Then check cache
    const allBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (allBeats) {
      const cachedBeat = allBeats.find(beat => beat.id === id);
      if (cachedBeat) return cachedBeat;
    }
    
    // Only make an API call as last resort
    return fetchBeatById(id);
  };
  
  const getUserPurchasedBeats = (): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  const getUserFavoriteBeats = (): Beat[] => {
    return beats.filter(beat => userFavorites.includes(beat.id));
  };

  // Force refresh method for manual refresh
  const forceRefresh = async () => {
    if (isOffline) {
      toast.error("You're offline. Can't refresh content.");
      return;
    }
    
    if (fetchInProgress) {
      toast.info("Content refresh already in progress.");
      return;
    }
    
    toast.info("Refreshing content...");
    
    // Clear expiry keys to force refresh
    localStorage.removeItem(CACHE_KEYS.ALL_BEATS_EXPIRY);
    localStorage.removeItem(CACHE_KEYS.TRENDING_EXPIRY);
    localStorage.removeItem(CACHE_KEYS.FEATURED_EXPIRY);
    localStorage.removeItem(CACHE_KEYS.WEEKLY_EXPIRY);
    
    // Fetch fresh data
    await fetchBeats();
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
    getProducerBeats: (producerId: string) => getProducerBeats(beats, producerId),
    getUserPurchasedBeats,
    getUserFavoriteBeats,
    dataFreshness,
    forceRefresh,
    fetchInProgress
  };
}
