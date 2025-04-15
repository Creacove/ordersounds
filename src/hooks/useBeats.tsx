
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
  const [retryCount, setRetryCount] = useState(0);
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);

  // Check network status and retry
  const checkNetworkAndRetry = async () => {
    if (!isOnline()) {
      setIsOffline(true);
      loadFallbackData();
      return false;
    }
    
    setIsOffline(false);
    return true;
  };
  
  // Load fallback data when offline or in case of errors
  const loadFallbackData = () => {
    console.log('Loading fallback data');
    
    // Use cached data if available
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS) || fallbackBeats;
    const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS) || fallbackBeats;
    const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS) || fallbackBeats[0];
    const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS) || fallbackBeats;
    
    setBeats(cachedBeats);
    setTrendingBeats(cachedTrending);
    setNewBeats(cachedBeats);
    setFeaturedBeat(cachedFeatured);
    setWeeklyPicks(cachedWeekly);
    
    // Log price data for debugging
    fallbackBeats.forEach(beat => {
      console.log('Beat pricing data:', {
        beatId: beat.id,
        beatTitle: beat.title,
        basic_local: beat.basic_license_price_local,
        basic_diaspora: beat.basic_license_price_diaspora,
        calculatedLocal: beat.basic_license_price_local || 0,
        calculatedDiaspora: beat.basic_license_price_diaspora || 0
      });
    });
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server. Using cached or demo content.');
  };

  const fetchBeats = useCallback(async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    // Check network status before attempting fetch
    if (!await checkNetworkAndRetry()) {
      return;
    }
    
    console.log('Fetching beats from API...');
    
    try {
      const transformedBeats = await fetchAllBeats();
      
      // Save all beats to cache
      saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      setBeats(transformedBeats);
      
      // Check if trending beats need to be refreshed
      const shouldRefreshTrending = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefreshTrending) {
        const trending = refreshTrendingBeats(transformedBeats);
        setTrendingBeats(trending);
      } else {
        // Try to load from cache
        const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
        if (cachedTrending) {
          setTrendingBeats(cachedTrending);
        } else {
          const trending = refreshTrendingBeats(transformedBeats);
          setTrendingBeats(trending);
        }
      }
      
      // Refresh featured beats based on cache expiration
      const shouldRefreshFeatured = checkShouldRefreshCache(CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      if (shouldRefreshFeatured) {
        const featured = selectFeaturedBeat(transformedBeats);
        setFeaturedBeat(featured);
      } else {
        // Try to load from cache
        const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS);
        if (cachedFeatured) {
          setFeaturedBeat(cachedFeatured);
        } else if (trendingBeats.length > 0) {
          const featured = {...trendingBeats[0], is_featured: true};
          setFeaturedBeat(featured);
        } else {
          // Fallback
          setFeaturedBeat(fallbackBeats[0]);
        }
      }
      
      // Refresh weekly picks based on cache expiration
      const shouldRefreshWeekly = checkShouldRefreshCache(CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      if (shouldRefreshWeekly) {
        const weekly = refreshWeeklyPicks(transformedBeats);
        setWeeklyPicks(weekly);
      } else {
        // Try to load from cache
        const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS);
        if (cachedWeekly) {
          setWeeklyPicks(cachedWeekly);
        } else {
          const weekly = refreshWeeklyPicks(transformedBeats);
          setWeeklyPicks(weekly);
        }
      }
      
      // Sort new beats by creation date
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
      
      // Reset loading and error states
      setIsLoading(false);
      setLoadingError(null);
      setRetryCount(0);
      setIsOffline(false);
      
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
    } catch (error) {
      console.error('Error fetching beats:', error);
      
      // Try to retry a few times before falling back to cached data
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchBeats(), 1000 * retryCount); // Increasing backoff
        return;
      }
      
      loadFallbackData();
      setLoadingError('Failed to load beats');
      toast.error('Failed to load beats');
    }
  }, [user, activeFilters, retryCount, trendingBeats.length]);

  // Fetch user favorites
  const fetchUserFavoritesData = async () => {
    if (!user) return;
    
    try {
      const favorites = await fetchUserFavorites(user.id);
      setUserFavorites(favorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

  // Fetch purchased beats
  const fetchPurchasedBeatsData = async () => {
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
  };
  
  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch data automatically when we're back online
      fetchBeats();
      toast.success("You're back online!");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline. Some features may be limited.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check immediately on mount
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchBeats();
    
    // Add an interval check to refresh trending beats if needed
    // Check every 5 minutes if the cache has expired
    const intervalId = setInterval(() => {
      const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefresh && beats.length > 0) {
        const trending = refreshTrendingBeats(beats);
        setTrendingBeats(trending);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
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
      
      // Update local state immediately for responsive UI
      const updatedFavorites = isFav
        ? userFavorites.filter(id => id !== beatId)
        : [...userFavorites, beatId];
        
      setUserFavorites(updatedFavorites);
      
      // Show toast based on action
      if (isFav) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
      
      // Update in the database
      try {
        await toggleFavoriteAPI(user.id, beatId, userFavorites);
        return !isFav; // Return new favorite status
      } catch (error) {
        // Revert on error
        setUserFavorites(userFavorites);
        toast.error('Failed to update favorites');
        console.error('Error updating favorites:', error);
        return isFav; // Return original state
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
    // First check if we have it locally
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    // If not found locally, fetch from API
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
