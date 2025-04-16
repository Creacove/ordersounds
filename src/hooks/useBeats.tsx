
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
  const [networkTimeout, setNetworkTimeout] = useState<NodeJS.Timeout | null>(null);

  // Move function declarations to the top to avoid temporal dead zone issues
  const fetchUserFavoritesData = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching user favorites for user:', user.id);
      const favorites = await fetchUserFavorites(user.id);
      console.log('User favorites fetched:', favorites);
      setUserFavorites(favorites);
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

  const fetchPurchasedBeatsData = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching purchased beats for user:', user.id);
      const purchasedIds = await fetchPurchasedBeats(user.id);
      console.log('Purchased beat IDs:', purchasedIds);
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

  const checkNetworkAndRetry = async () => {
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
  }, []);

  const fetchBeats = useCallback(async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    if (networkTimeout) {
      clearTimeout(networkTimeout);
    }
    
    if (!await checkNetworkAndRetry()) {
      return;
    }
    
    console.log('Fetching beats from API...');
    
    try {
      // Set a timeout for the API call
      const timeoutPromise = new Promise<null>((_, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error("Request timed out after 15 seconds"));
        }, 15000);
        setNetworkTimeout(timeout);
        return () => clearTimeout(timeout);
      });
      
      const transformedBeats = await Promise.race([
        fetchAllBeats(),
        timeoutPromise
      ]) as Beat[];
      
      if (networkTimeout) {
        clearTimeout(networkTimeout);
        setNetworkTimeout(null);
      }
      
      if (!transformedBeats || transformedBeats.length === 0) {
        console.warn("No beats returned from API, using fallback data");
        loadFallbackData();
        return;
      }
      
      console.log(`Fetched ${transformedBeats.length} beats from API`);
      saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      setBeats(transformedBeats);
      
      const shouldRefreshTrending = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefreshTrending) {
        const trending = refreshTrendingBeats(transformedBeats);
        setTrendingBeats(trending);
      } else {
        const cachedTrending = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
        if (cachedTrending) {
          setTrendingBeats(cachedTrending);
        } else {
          const trending = refreshTrendingBeats(transformedBeats);
          setTrendingBeats(trending);
        }
      }
      
      const shouldRefreshFeatured = checkShouldRefreshCache(CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
      if (shouldRefreshFeatured) {
        const featured = selectFeaturedBeat(transformedBeats);
        setFeaturedBeat(featured);
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
      
      const shouldRefreshWeekly = checkShouldRefreshCache(CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
      if (shouldRefreshWeekly) {
        const weekly = refreshWeeklyPicks(transformedBeats);
        setWeeklyPicks(weekly);
      } else {
        const cachedWeekly = loadFromCache<Beat[]>(CACHE_KEYS.WEEKLY_PICKS);
        if (cachedWeekly) {
          setWeeklyPicks(cachedWeekly);
        } else {
          const weekly = refreshWeeklyPicks(transformedBeats);
          setWeeklyPicks(weekly);
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
      
      if (user) {
        await fetchUserFavoritesData();
        await fetchPurchasedBeatsData();
      }
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      
      if (networkTimeout) {
        clearTimeout(networkTimeout);
        setNetworkTimeout(null);
      }
      
      if (retryCount < 3) {
        console.log(`Retry attempt ${retryCount + 1} of 3`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchBeats(), 1000 * (retryCount + 1));
        return;
      }
      
      loadFallbackData();
      setLoadingError(`Failed to load beats: ${error.message || 'Unknown error'}`);
      
      if (error.message?.includes("timed out")) {
        toast.error('Beat loading timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to load beats. Using cached content.');
      }
    }
  }, [user, activeFilters, retryCount, loadFallbackData, networkTimeout]);

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
      if (networkTimeout) {
        clearTimeout(networkTimeout);
      }
    };
  }, [fetchBeats, networkTimeout]);

  useEffect(() => {
    fetchBeats();
    
    const intervalId = setInterval(() => {
      const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefresh && beats.length > 0) {
        const trending = refreshTrendingBeats(beats);
        setTrendingBeats(trending);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchBeats, beats.length]);

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
    console.log(`Getting beat by ID: ${id}`);
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) {
      console.log(`Found beat locally: ${localBeat.title}`);
      return localBeat;
    }
    
    console.log(`Fetching beat from API: ${id}`);
    return fetchBeatById(id);
  };
  
  const getUserPurchasedBeats = (): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  const getUserFavoriteBeats = (): Beat[] => {
    return beats.filter(beat => userFavorites.includes(beat.id));
  };

  // Force refresh function to allow manual refresh
  const forceRefreshBeats = () => {
    setRetryCount(0);
    fetchBeats();
    toast.success('Refreshing beats...');
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
    forceRefreshBeats, // Add this new function to the returned object
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
