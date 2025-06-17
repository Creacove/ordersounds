
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { 
  fetchAllBeats, fetchTrendingBeats, fetchMetricBasedTrending, fetchRandomBeats, fetchNewBeats,
  fetchBeatById, clearBeatsCache
} from '@/services/beats';

export function useBeatsQuery() {
  const { user } = useAuth();
  const [dataFetched, setDataFetched] = useState<boolean>(false);

  // Main beats query with improved error handling
  const { 
    data: beats = [], 
    isLoading: isLoadingBeats, 
    refetch: refetchBeats,
    error: beatsError
  } = useQuery({
    queryKey: ['beats', user?.id, user?.role],
    queryFn: async () => {
      console.log('Fetching beats from useBeatsQuery...');
      
      try {
        if (user?.role === 'producer') {
          const producerBeats = await fetchAllBeats({ 
            includeDrafts: true, 
            producerId: user.id, 
            limit: 50
          });
          setDataFetched(true);
          return producerBeats;
        }
        
        const allBeats = await fetchAllBeats({ 
          includeDrafts: false,
          limit: 50
        });
        setDataFetched(true);
        return allBeats;
      } catch (error) {
        console.error('Error in beats query:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Trending beats query with better error handling
  const { 
    data: trendingBeats = [], 
    isLoading: isLoadingTrending,
    error: trendingError 
  } = useQuery({
    queryKey: ['trending-beats'],
    queryFn: async () => {
      console.log('Fetching trending beats...');
      try {
        return await fetchTrendingBeats(30);
      } catch (error) {
        console.error('Error fetching trending beats:', error);
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Metrics-based trending beats query
  const { 
    data: metricsTrendingBeats = [], 
    isLoading: isLoadingMetricsTrending 
  } = useQuery({
    queryKey: ['metrics-trending-beats'],
    queryFn: async () => {
      console.log('Fetching metrics-based trending beats...');
      try {
        return await fetchMetricBasedTrending(100);
      } catch (error) {
        console.error('Error fetching metrics-based trending beats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // New beats query
  const { 
    data: newBeats = [], 
    isLoading: isLoadingNew,
    error: newBeatsError 
  } = useQuery({
    queryKey: ['new-beats'],
    queryFn: async () => {
      console.log('Fetching new beats...');
      try {
        return await fetchNewBeats(30);
      } catch (error) {
        console.error('Error fetching new beats:', error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Weekly picks query
  const { 
    data: weeklyPicks = [], 
    isLoading: isLoadingWeekly 
  } = useQuery({
    queryKey: ['weekly-picks'],
    queryFn: async () => {
      console.log('Fetching weekly picks...');
      try {
        return await fetchRandomBeats(8);
      } catch (error) {
        console.error('Error fetching weekly picks:', error);
        throw error;
      }
    },
    staleTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
  });

  // Use the first trending beat as featured beat - simple and reliable
  const featuredBeat = trendingBeats.length > 0 ? { ...trendingBeats[0], is_featured: true } : null;

  const isLoading = isLoadingBeats || isLoadingTrending || isLoadingNew || isLoadingWeekly;
  
  // Combine all errors for better debugging
  const allErrors = [beatsError, trendingError, newBeatsError].filter(Boolean);
  const loadingError = allErrors.length > 0 ? 
    `Failed to load data: ${allErrors.map(e => e.message).join(', ')}` : null;

  console.log('useBeatsQuery state:', {
    isLoading,
    beatsCount: beats.length,
    trendingCount: trendingBeats.length,
    newBeatsCount: newBeats.length,
    weeklyPicksCount: weeklyPicks.length,
    featuredBeat: !!featuredBeat,
    errors: allErrors.map(e => e.message)
  });

  const forceRefreshBeats = useCallback(async () => {
    console.log("Force refreshing beats data with React Query...");
    clearBeatsCache();
    setDataFetched(false);
    await refetchBeats();
    console.log("Beats data refreshed");
  }, [refetchBeats]);

  const getBeatById = async (id: string): Promise<Beat | null> => {
    const localBeat = beats.find(beat => beat.id === id);
    if (localBeat) return localBeat;
    
    return fetchBeatById(id);
  };

  const getProducerBeats = (producerId: string): Beat[] => {
    return beats.filter(beat => beat.producer_id === producerId);
  };

  return {
    beats,
    trendingBeats,
    metricsTrendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading,
    loadingError,
    forceRefreshBeats,
    getBeatById,
    getProducerBeats,
    dataFetched
  };
}
