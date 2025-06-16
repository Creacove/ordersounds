
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { fetchAllBeats, fetchTrendingBeats, fetchNewBeats, fetchBeatById } from '@/services/beats';
import { performanceMonitor } from '@/utils/performanceMonitor';

export function useBeatsQuery(options?: { 
  producerId?: string;
  limit?: number;
  enabled?: boolean;
}) {
  const { producerId, limit = 20, enabled = true } = options || {};
  
  return useQuery({
    queryKey: ['beats', { producerId, limit }],
    queryFn: () => performanceMonitor.measureAsync(
      'fetchAllBeats',
      () => fetchAllBeats({ 
        includeDrafts: !!producerId, 
        producerId, 
        limit 
      }),
      { producerId, limit }
    ),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTrendingBeatsQuery(limit = 10) {
  return useQuery({
    queryKey: ['trending-beats', limit],
    queryFn: () => performanceMonitor.measureAsync(
      'fetchTrendingBeats',
      () => fetchTrendingBeats(limit, true),
      { limit }
    ),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useNewBeatsQuery(limit = 10) {
  return useQuery({
    queryKey: ['new-beats', limit],
    queryFn: () => performanceMonitor.measureAsync(
      'fetchNewBeats',
      () => fetchNewBeats(limit),
      { limit }
    ),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useBeatQuery(beatId: string, enabled = true) {
  return useQuery({
    queryKey: ['beat', beatId],
    queryFn: () => performanceMonitor.measureAsync(
      'fetchBeatById',
      () => fetchBeatById(beatId),
      { beatId }
    ),
    enabled: enabled && !!beatId,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
