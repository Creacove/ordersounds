import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';
import { fetchPurchasedBeats, fetchPurchasedBeatDetails } from '@/services/beats';
import { useBeatsQuery } from './useBeatsQuery';
import { useFavorites } from './useFavorites';
import { useAudioPlayer } from './useAudioPlayer';
import { useBeatFilters } from './useBeatFilters';

export function useBeats() {
  const { user } = useAuth();
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [fetchInProgress, setFetchInProgress] = useState(false);

  // Use the new focused hooks
  const {
    beats,
    trendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading,
    loadingError,
    forceRefreshBeats,
    getBeatById,
    getProducerBeats,
    dataFetched
  } = useBeatsQuery();

  const {
    userFavorites,
    isLoadingFavorites,
    favoritesFetchInProgress,
    toggleFavorite,
    isFavorite,
    getUserFavoriteBeats,
    refreshUserFavorites
  } = useFavorites();

  const {
    currentBeat,
    isPlaying,
    handlePlayBeat,
    isCurrentBeat,
    isCurrentlyPlaying,
    incrementPlayCount
  } = useAudioPlayer();

  const {
    filteredBeats,
    activeFilters,
    updateFilters,
    clearFilters
  } = useBeatFilters(beats);

  // Keep existing purchased beats logic (unchanged)
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
      
      const cachedPurchases = loadFromCache<string[]>(CACHE_KEYS.USER_PURCHASES);
      if (cachedPurchases) {
        setPurchasedBeats(cachedPurchases);
      }
    }
  }, [user, beats.length]);

  // Keep existing network status logic (unchanged)
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

  // Fetch purchased beats when user changes
  useEffect(() => {
    if (user) {
      fetchPurchasedBeatsData();
    }
  }, [user, fetchPurchasedBeatsData]);

  const isPurchased = (beatId: string): boolean => {
    return purchasedBeats.includes(beatId);
  };
  
  const getUserPurchasedBeats = (): Beat[] => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  // Legacy compatibility wrapper for fetchBeats
  const fetchBeats = useCallback(async (options?: { skipCache?: boolean }) => {
    if (options?.skipCache) {
      await forceRefreshBeats();
    }
    // Data is automatically fetched by React Query
  }, [forceRefreshBeats]);

  // Legacy compatibility wrapper for fetchUserFavorites
  const fetchUserFavorites = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      await refreshUserFavorites();
    }
    // Data is automatically fetched by React Query
  }, [refreshUserFavorites]);

  return {
    // Data
    beats,
    filteredBeats,
    trendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    userFavorites,
    purchasedBeats,
    
    // Loading states
    isLoading,
    loadingError,
    isOffline,
    fetchInProgress,
    favoritesFetchInProgress,
    dataFetched,
    
    // Actions
    updateFilters,
    clearFilters,
    fetchBeats,
    toggleFavorite,
    isFavorite,
    isPurchased,
    fetchUserFavorites: fetchUserFavorites,
    fetchPurchasedBeats: fetchPurchasedBeatsData,
    refreshUserFavorites,
    getBeatById,
    getUserPurchasedBeats,
    getUserFavoriteBeats,
    getProducerBeats,
    forceRefreshBeats,
    
    // Audio player (for backward compatibility)
    handlePlayBeat,
    isCurrentBeat,
    isCurrentlyPlaying,
    
    // Filter state
    activeFilters
  };
}
