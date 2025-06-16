
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { searchBeats, searchProducers, getPopularSearchTerms, getGenres, SearchParams, SearchResults } from '@/services/search/searchService';

export function useOptimizedSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Omit<SearchParams, 'query' | 'limit' | 'offset'>>({});
  const [activeTab, setActiveTab] = useState<'all' | 'beats' | 'producers'>('all');

  // Debounce search term to avoid excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoize search parameters
  const searchParams = useMemo(() => ({
    query: debouncedSearchTerm,
    ...filters
  }), [debouncedSearchTerm, filters]);

  // Show all beats by default or when searching
  const shouldSearch = debouncedSearchTerm.length >= 2 || Object.keys(filters).length > 0 || debouncedSearchTerm.length === 0;

  // Infinite query for beats with pagination
  const {
    data: beatsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingBeats,
    error: beatsError
  } = useInfiniteQuery({
    queryKey: ['search-beats', searchParams],
    queryFn: ({ pageParam = 0 }) => 
      searchBeats({ 
        ...searchParams, 
        limit: 20, 
        offset: (pageParam as number) * 20 
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: SearchResults, allPages) => 
      lastPage.hasMore ? allPages.length : undefined,
    enabled: shouldSearch,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Producers search query
  const {
    data: producers = [],
    isLoading: isLoadingProducers
  } = useQuery({
    queryKey: ['search-producers', debouncedSearchTerm],
    queryFn: () => searchProducers(debouncedSearchTerm),
    enabled: debouncedSearchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
  });

  // Popular search terms
  const {
    data: popularTerms = []
  } = useQuery({
    queryKey: ['popular-search-terms'],
    queryFn: getPopularSearchTerms,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Genres
  const {
    data: genres = []
  } = useQuery({
    queryKey: ['search-genres'],
    queryFn: getGenres,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Flatten beats data from infinite query
  const allBeats = useMemo(() => {
    return beatsData?.pages.flatMap(page => page.beats) || [];
  }, [beatsData]);

  // Filter results based on active tab
  const filteredResults = useMemo(() => {
    switch (activeTab) {
      case 'beats':
        return { beats: allBeats, producers: [] };
      case 'producers':
        return { beats: [], producers };
      default:
        return { beats: allBeats, producers };
    }
  }, [activeTab, allBeats, producers]);

  // Actions
  const updateSearchTerm = useCallback((term: string) => {
    console.log('Updating search term to:', term);
    setSearchTerm(term);
  }, []);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const loadMoreBeats = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return {
    // State
    searchTerm,
    debouncedSearchTerm,
    filters,
    activeTab,
    
    // Data
    beats: filteredResults.beats,
    producers: filteredResults.producers,
    popularTerms,
    genres,
    totalResults: allBeats.length,
    
    // Loading states
    isLoading: isLoadingBeats || isLoadingProducers,
    isLoadingBeats,
    isLoadingProducers,
    isFetchingNextPage,
    hasNextPage,
    
    // Errors
    error: beatsError,
    
    // Actions
    updateSearchTerm,
    updateFilters,
    clearFilters,
    setActiveTab,
    loadMoreBeats,
    
    // Helpers
    hasResults: allBeats.length > 0 || producers.length > 0,
    showMinimumLengthMessage: searchTerm.length > 0 && searchTerm.length < 2,
    showNoResults: shouldSearch && !isLoadingBeats && allBeats.length === 0 && producers.length === 0 && searchTerm.length >= 2
  };
}
