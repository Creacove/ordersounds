
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { 
  fetchTrendingBeats, 
  fetchNewBeats, 
  fetchRandomBeats, 
  fetchFeaturedBeats 
} from '@/services/beats';

export function usePublicBeatsQuery() {
  console.log('🚀 Loading public beats independently...');

  // Main trending beats query (loads immediately)
  const { 
    data: trendingBeats = [], 
    isLoading: isLoadingTrending 
  } = useQuery({
    queryKey: ['public-trending-beats'],
    queryFn: () => fetchTrendingBeats(30),
    staleTime: 5 * 60 * 1000,
  });

  // New beats query (loads immediately)
  const { 
    data: newBeats = [], 
    isLoading: isLoadingNew 
  } = useQuery({
    queryKey: ['public-new-beats'],
    queryFn: () => fetchNewBeats(30),
    staleTime: 5 * 60 * 1000,
  });

  // Weekly picks query (loads immediately)
  const { 
    data: weeklyPicks = [], 
    isLoading: isLoadingWeekly 
  } = useQuery({
    queryKey: ['public-weekly-picks'],
    queryFn: () => fetchRandomBeats(8),
    staleTime: 60 * 60 * 1000,
  });

  // Featured beat query (loads immediately)
  const { 
    data: featuredBeats = [], 
    isLoading: isLoadingFeatured 
  } = useQuery({
    queryKey: ['public-featured-beats'],
    queryFn: () => fetchFeaturedBeats(1),
    staleTime: 10 * 60 * 1000,
  });

  const featuredBeat = featuredBeats.length > 0 ? { ...featuredBeats[0], is_featured: true } : null;
  const isLoading = isLoadingTrending || isLoadingNew || isLoadingWeekly || isLoadingFeatured;

  console.log('📊 Public beats loaded:', {
    trending: trendingBeats.length,
    new: newBeats.length,
    weekly: weeklyPicks.length,
    featured: featuredBeat ? 1 : 0,
    loading: isLoading
  });

  return {
    trendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    isLoading,
    dataLoaded: !isLoading && (trendingBeats.length > 0 || newBeats.length > 0)
  };
}
