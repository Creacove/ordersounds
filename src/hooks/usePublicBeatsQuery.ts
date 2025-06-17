
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { fetchAllBeatsUnified, fetchBeatsByType } from '@/services/beats/unifiedQueryService';

export function usePublicBeatsQuery() {
  console.log('🚀 Loading public beats with unified query...');

  // Single unified query that fetches all beat types
  const { 
    data: beatsData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['unified-public-beats'],
    queryFn: fetchAllBeatsUnified,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Fallback queries that only run if the main query fails
  const { data: fallbackTrending = [] } = useQuery({
    queryKey: ['fallback-trending-beats'],
    queryFn: () => fetchBeatsByType('trending'),
    enabled: !!error && !isLoading,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: fallbackNew = [] } = useQuery({
    queryKey: ['fallback-new-beats'],
    queryFn: () => fetchBeatsByType('new'),
    enabled: !!error && !isLoading,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const { data: fallbackFeatured = [] } = useQuery({
    queryKey: ['fallback-featured-beats'],
    queryFn: () => fetchBeatsByType('featured'),
    enabled: !!error && !isLoading,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Use main data if available, otherwise fall back to individual queries
  const trendingBeats = beatsData?.trendingBeats || fallbackTrending;
  const newBeats = beatsData?.newBeats || fallbackNew;
  const weeklyPicks = beatsData?.weeklyPicks || [];
  const featuredBeats = beatsData?.featuredBeats || fallbackFeatured;
  const featuredBeat = featuredBeats.length > 0 ? { ...featuredBeats[0], is_featured: true } : null;

  // Enhanced loading state that considers fallbacks
  const isLoadingWithFallbacks = isLoading && !beatsData && fallbackTrending.length === 0;
  const dataLoaded = !isLoadingWithFallbacks && (
    trendingBeats.length > 0 || 
    newBeats.length > 0 || 
    weeklyPicks.length > 0 ||
    featuredBeats.length > 0
  );

  console.log('📊 Public beats query result:', {
    trending: trendingBeats.length,
    new: newBeats.length,
    weekly: weeklyPicks.length,
    featured: featuredBeat ? 1 : 0,
    loading: isLoadingWithFallbacks,
    dataLoaded,
    hasError: !!error,
    usingFallback: !!error && (fallbackTrending.length > 0 || fallbackNew.length > 0)
  });

  // Log any errors for debugging
  if (error) {
    console.error('🚨 Public beats query error:', error);
  }

  return {
    trendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading: isLoadingWithFallbacks,
    dataLoaded,
    error: error as Error | null,
    refetch
  };
}
