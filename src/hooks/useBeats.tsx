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
  toggleFavoriteAPI, fetchBeatById, getProducerBeats, getUserFavoriteBeats
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

  const fetchUserData = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch both favorites and purchases in parallel
      const [favorites, purchasedIds] = await Promise.all([
        fetchUserFavorites(user.id),
        fetchPurchasedBeats(user.id)
      ]);
      
      setUserFavorites(favorites);
      setPurchasedBeats(purchasedIds);
      
      // Cache the results
      localStorage.setItem(CACHE_KEYS.USER_FAVORITES, JSON.stringify(favorites));
      localStorage.setItem(CACHE_KEYS.USER_PURCHASES, JSON.stringify(purchasedIds));
      
      // If we have purchased beats but no beats data, fetch the details
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
      console.error('Error fetching user data:', error);
      
      // Fall back to cached data if available
      const cachedFavorites = loadFromCache<string[]>(CACHE_KEYS.USER_FAVORITES);
      const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      
      if (cachedFavorites) setUserFavorites(cachedFavorites);
      if (cachedPurchases) setPurchasedBeats(cachedPurchases);
    }
  }, [user, beats.length]);

  const fetchBeatsData = useCallback(async () => {
    if (fetchInProgress) {
      console.log('Fetch already in progress, skipping duplicate request');
      return;
    }
    
    setFetchInProgress(true);
    setLoadingError(null);
    
    try {
      // Check cache first
      const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
      const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      if (cachedBeats && !shouldRefresh) {
        console.log('Using cached beats data');
        setBeats(cachedBeats);
        return;
      }
      
      // Fetch all required data in parallel
      const [initialBeats, trendingData, newData, weeklyData] = await Promise.all([
        fetchAllBeats(),
        fetchTrendingBeats(30),
        fetchNewBeats(30),
        fetchRandomBeats(6)
      ]);
      
      if (!initialBeats || initialBeats.length === 0) {
        handleNoBeatsFound();
        return;
      }
      
      // Update all states with fetched data
      setBeats(initialBeats);
      saveToCache(CACHE_KEYS.ALL_BEATS, initialBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
      
      if (trendingData?.length) setTrendingBeats(trendingData);
      if (newData?.length) setNewBeats(newData);
      if (weeklyData?.length) setWeeklyPicks(weeklyData);
      
      // Set featured beat
      const featured = selectFeaturedBeat(initialBeats);
      setFeaturedBeat(featured);
      
      // Apply filters if active
      if (activeFilters) {
        const filtered = applyFilters(initialBeats, activeFilters);
        setFilteredBeats(filtered);
      } else {
        setFilteredBeats(initialBeats);
      }
      
      setLoadingError(null);
      setIsOffline(false);
      
      // Fetch user-specific data if needed
      if (user) {
        await fetchUserData();
      }
      
    } catch (error: any) {
      console.error('Error fetching beats:', error);
      setLoadingError(`Failed to load complete beat collection: ${error.message || 'Unknown error'}`);
      
      if (error.message?.includes("timed out")) {
        toast.error('Beat loading timed out. Please check your connection and try again.');
      } else {
        toast.error('Failed to load all beats. Only showing initial content.');
      }
    } finally {
      setFetchInProgress(false);
      setIsLoading(false);
    }
  }, [user, activeFilters, handleNoBeatsFound, fetchInProgress, fetchUserData]);

  useEffect(() => {
    // Only fetch data if not already in progress
    if (!fetchInProgress) {
      fetchBeatsData();
    }
    
    // Network status handlers
    const handleOnline = () => {
      setIsOffline(false);
      fetchBeatsData(); // Refetch when coming back online
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
  }, [fetchBeatsData, fetchInProgress]);

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
    toggleFavorite,
    isFavorite,
    isPurchased,
    fetchUserFavorites: () => fetchUserData(),
    fetchPurchasedBeats: () => fetchUserData(),
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
