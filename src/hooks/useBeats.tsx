
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

  // Use the focused hooks - but make them non-blocking
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

  // Make purchased beats loading non-blocking
  const fetchPurchasedBeatsData = useCallback(async () => {
    if (!user) return;
    
    try {
      const purchasedIds = await fetchPurchasedBeats(user.id);
      setPurchasedBeats(purchasedIds);
      
      // Don't block on purchased beats details loading
      if (purchasedIds.length > 0) {
        // Load details in background
        fetchPurchasedBeatDetails(purchasedIds).then(purchasedBeatsDetails => {
          if (purchasedBeatsDetails.length > 0) {
            console.log('Purchased beats loaded:', purchasedBeatsDetails.length);
          }
        }).catch(error => {
          console.error('Error loading purchased beat details:', error);
        });
      }
    } catch (error) {
      console.error('Error fetching purchased beats:', error);
      
      // Try to load from localStorage as fallback
      const cachedPurchases = localStorage.getItem('user_purchases');
      if (cachedPurchases) {
        try {
          const parsed = JSON.parse(cachedPurchases);
          setPurchasedBeats(parsed);
        } catch (parseError) {
          console.error('Error parsing cached purchases:', parseError);
        }
      }
    }
  }, [user]);

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

  // Fetch purchased beats when user changes - in background
  useEffect(() => {
    if (user) {
      // Don't await this - let it load in background
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
    
    // Loading states - make them non-blocking for homepage
    isLoading: false, // Don't block homepage loading
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
