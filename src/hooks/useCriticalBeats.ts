
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { fetchAllBeats, fetchTrendingBeats } from '@/services/beats/queryService';
import { toast } from 'sonner';

interface CriticalBeatsState {
  essentialBeats: Beat[];
  featuredBeat: Beat | null;
  trendingBeats: Beat[];
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

const CIRCUIT_BREAKER_THRESHOLD = 2;
const CACHE_KEY = 'critical_beats_cache';

export function useCriticalBeats() {
  const [circuitBreakerOpen, setCircuitBreakerOpen] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [fallbackData, setFallbackData] = useState<CriticalBeatsState | null>(null);

  // Load cached data on mount
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        setFallbackData(JSON.parse(cached));
      } catch (error) {
        console.error('Error parsing cached beats:', error);
      }
    }
  }, []);

  // Phase 1: Essential beats query (highest priority)
  const { 
    data: essentialBeats = [], 
    isLoading: isLoadingEssential,
    error: essentialError
  } = useQuery({
    queryKey: ['essential-beats'],
    queryFn: async () => {
      console.log('Fetching essential beats (critical path)');
      const beats = await fetchAllBeats({ limit: 10, includeDrafts: false });
      
      // Cache successful results
      const cacheData = {
        essentialBeats: beats,
        featuredBeat: beats[0] || null,
        trendingBeats: [],
        isLoading: false,
        error: null,
        retryCount: 0
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      
      return beats;
    },
    enabled: !circuitBreakerOpen,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error) => {
      if (failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
        setCircuitBreakerOpen(true);
        setRetryCount(failureCount);
        toast.error('Using cached content due to connection issues');
        return false;
      }
      return true;
    }
  });

  // Phase 2: Trending beats (secondary priority, only after essential beats load)
  const { 
    data: trendingBeats = [], 
    isLoading: isLoadingTrending 
  } = useQuery({
    queryKey: ['trending-beats-critical'],
    queryFn: () => fetchTrendingBeats(5),
    enabled: !circuitBreakerOpen && essentialBeats.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1 // Reduced retries for secondary content
  });

  // Circuit breaker recovery
  useEffect(() => {
    if (circuitBreakerOpen) {
      const recoveryTimer = setTimeout(() => {
        console.log('Attempting circuit breaker recovery');
        setCircuitBreakerOpen(false);
        setRetryCount(0);
      }, 30000); // 30 second recovery window

      return () => clearTimeout(recoveryTimer);
    }
  }, [circuitBreakerOpen]);

  // Determine final state with fallback logic
  const finalState: CriticalBeatsState = {
    essentialBeats: circuitBreakerOpen && fallbackData ? fallbackData.essentialBeats : essentialBeats,
    featuredBeat: circuitBreakerOpen && fallbackData ? fallbackData.featuredBeat : (essentialBeats[0] || null),
    trendingBeats: circuitBreakerOpen && fallbackData ? fallbackData.trendingBeats : trendingBeats,
    isLoading: isLoadingEssential || (essentialBeats.length > 0 && isLoadingTrending),
    error: essentialError ? `Failed to load beats: ${essentialError.message}` : null,
    retryCount
  };

  return {
    ...finalState,
    circuitBreakerOpen,
    hasCache: !!fallbackData
  };
}
