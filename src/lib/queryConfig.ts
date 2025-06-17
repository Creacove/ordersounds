
import { QueryClient } from '@tanstack/react-query';

// Enhanced Query Client configuration for consistent behavior
export const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Consistent stale time across all queries
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
        
        // Retry configuration with exponential backoff
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for other errors
          return failureCount < 3;
        },
        
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        
        // Reduce aggressive refetching
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: true,
        
        // Network mode for better offline handling
        networkMode: 'online',
      },
      mutations: {
        retry: 1,
        networkMode: 'online',
      },
    },
  });
};

// Query key factory for consistent cache management
export const queryKeys = {
  beats: {
    all: ['beats'] as const,
    unified: ['unified-public-beats'] as const,
    trending: ['trending-beats'] as const,
    new: ['new-beats'] as const,
    featured: ['featured-beats'] as const,
    weekly: ['weekly-picks'] as const,
    fallback: {
      trending: ['fallback-trending-beats'] as const,
      new: ['fallback-new-beats'] as const,
      featured: ['fallback-featured-beats'] as const,
    },
  },
  producers: {
    all: ['producers'] as const,
  },
  favorites: {
    user: (userId: string) => ['favorites', userId] as const,
  },
} as const;

// Cache management utilities
export const cacheUtils = {
  invalidateBeats: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: queryKeys.beats.all });
  },
  
  prefetchBeats: (queryClient: QueryClient) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.beats.unified,
      staleTime: 5 * 60 * 1000,
    });
  },
  
  clearBeatsCache: (queryClient: QueryClient) => {
    queryClient.removeQueries({ queryKey: queryKeys.beats.all });
  },
};
