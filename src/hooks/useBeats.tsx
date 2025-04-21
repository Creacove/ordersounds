
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
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);
  const [fetchInProgress, setFetchInProgress] = useState(false);

  // Declare fetchUserFavoritesData and fetchPurchasedBeatsData before referencing them
  const fetchUserFavoritesData = useCallback(async () => {
    if (!user) return;
    
    try {
      const favorites = await fetchUserFavorites(user.id);
      setUserFavorites(favorites);
      
      // Cache user favorites for offline use
      localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      
      // Try to load from cache if available
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      if (cachedFavorites) {
        setUserFavorites(cachedFavorites);
      }
    }
  }, [user]);

  const fetchPurchasedBeatsData = useCallback(async () => {
    if (!user) return;
    
    try {
      const purchasedIds = await fetchPurchasedBeats(user.id);
      setPurchasedBeats(purchasedIds);
      
      // Cache purchased beats for offline use
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
      
      // Try to load from cache if available
      const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchases) {
        setPurchasedBeats(cachedPurchases);
      }
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
    
    setBeats(cachedBeats);
    setTrendingBeats(cachedTrending);
    setNewBeats(cachedBeats);
    setFeaturedBeat(cachedFeatured);
    setWeeklyPicks(cachedWeekly);
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server. Using cached or demo content.');
    
    // Try to load user data from cache
    const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
    if (cachedFavorites) {
      setUserFavorites(cachedFavorites);
    }
    
    const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
    if (cachedPurchases) {
      setPurchasedBeats(cachedPurchases);
    }
  }, []);

  const fetchBeats = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchInProgress) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    setFetchInProgress(true);
    setIsLoading(true);
    setLoadingError(null);
    
    if (!await checkNetworkAndRetry()) {
      setFetchInProgress(false);
      return;
    }
    
    console.log('Fetching beats from API...');
    
    try {
      // Single fetch with extended timeout - no retry or race here
      const transformedBeats = await fetchAllBeats();
      
      if (!transformedBeats || transformedBeats.length === 0) {
        console.warn("No beats returned from API, using fallback data");
        loadFallbackData();
        setFetchInProgress(false);
        return;
      }
      
      // Save all beats to cache with extended duration
      saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      setBeats(transformedBeats);
      
      // Process trending beats
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
        }
      }
      
      // Process featured beat
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
        } else {
          setFeaturedBeat(fallbackBeats[0]);
        }
      }
      
      // Process weekly picks
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
        }
      }
      
      // Sort beats by newest
      const sortedByNew = [...transformedBeats].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNewBeats(sortedByNew);
      
      // Apply any active filters
      if (activeFilters) {
        const filtered = applyFilters(transformedBeats, activeFilters);
        setFilteredBeats(filtered);
      } else {
        setFilteredBeats(transformedBeats);
      }
      
      setIsLoading(false);
      setLoadingError(null);
      setIsOffline(false);
      
      // After loading beats, fetch user-specific data
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      
      // No retries, just load from cache or fallback data
      loadFallbackData();
      setLoadingError(`Failed to load beats: ${error.message || 'Unknown error'}`);
      
      if (error.message?.includes("timed out")) {
        toast.error('Beat loading timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to load beats. Using cached content. Click the refresh button to try again.');
      }
    } finally {
      setFetchInProgress(false);
    }
  }, [user, activeFilters, checkNetworkAndRetry, loadFallbackData, fetchUserFavoritesData, fetchPurchasedBeatsData]);

  useEffect(() => {
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
  }, []);

  // Initial data fetch on component mount
  useEffect(() => {
    fetchBeats();
  }, [fetchBeats]);

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
        // Update favorites in the background
        await toggleFavoriteAPI(user.id, beatId, userFavorites);
        
        // Update local cache
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
    // First try to find the beat in local state
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    // Then try to load from cache
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (cachedBeats) {
      const cachedBeat = cachedBeats.find(beat => beat.id === id);
      if (cachedBeat) return cachedBeat;
    }
    
    // Only fetch from API as last resort
    return fetchBeatById(id);
  };
  
  const getUserPurchasedBeats = (): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  const getUserFavoriteBeats = (): Beat[] => {
    return beats.filter(beat => userFavorites.includes(beat.id));
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
    fetchBeats,  // Primary function to load all beats data
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
    fetchInProgress
  };
}
