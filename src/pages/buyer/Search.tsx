
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useOptimizedSearch } from "@/hooks/search/useOptimizedSearch";
import { SearchInput } from "@/components/search/SearchInput";
import { SearchResults } from "@/components/search/SearchResults";
import { SearchFilters } from "@/components/search/SearchFilters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || "";
  const initialGenre = searchParams.get('genre') || "";
  
  const {
    searchTerm,
    debouncedSearchTerm,
    filters,
    activeTab,
    beats,
    producers,
    popularTerms,
    genres,
    isLoading,
    isLoadingBeats,
    isLoadingProducers,
    isFetchingNextPage,
    hasNextPage,
    error,
    updateSearchTerm,
    updateFilters,
    clearFilters,
    setActiveTab,
    loadMoreBeats,
    hasResults,
    showMinimumLengthMessage,
    showNoResults
  } = useOptimizedSearch();

  const isMobile = useIsMobile();

  // Set initial search term and genre from URL params
  useEffect(() => {
    if (initialQuery && initialQuery !== searchTerm) {
      updateSearchTerm(initialQuery);
    }
    if (initialGenre && initialGenre !== filters.genre) {
      updateFilters({ genre: initialGenre });
    }
  }, [initialQuery, initialGenre, searchTerm, filters.genre, updateSearchTerm, updateFilters]);

  // Update URL when search changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearchTerm.trim()) {
      params.set('q', debouncedSearchTerm.trim());
    }
    if (filters.genre) {
      params.set('genre', filters.genre);
    }
    setSearchParams(params);
  }, [debouncedSearchTerm, filters.genre, setSearchParams]);

  const handleGenreSelect = (genre: string) => {
    if (filters.genre === genre) {
      updateFilters({ genre: undefined });
    } else {
      updateFilters({ genre });
    }
  };

  const handleClearFilters = () => {
    clearFilters();
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key] !== undefined).length;

  return (
    <MainLayoutWithPlayer>
      <div className={cn(
        "container py-4 sm:py-6",
        isMobile ? "px-3 sm:px-6" : ""
      )}>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Search</h1>
        
        {/* Search Input */}
        <div className="mb-4 sm:mb-6">
          <SearchInput
            value={searchTerm}
            onChange={updateSearchTerm}
            suggestions={popularTerms}
            showSuggestions={!searchTerm}
            placeholder="Search beats, producers, genres..."
          />
        </div>

        {/* Show minimum length message */}
        {showMinimumLengthMessage && (
          <div className="mb-4 text-sm text-muted-foreground text-center">
            Type at least 2 characters to search
          </div>
        )}

        {/* Error handling */}
        {error && (
          <div className="mb-4 text-sm text-destructive text-center">
            Something went wrong. Please try again.
          </div>
        )}

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <TabsList className="tabs-mobile w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="beats">Beats ({beats.length})</TabsTrigger>
              <TabsTrigger value="producers">Producers ({producers.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* Search Filters */}
          <SearchFilters
            genres={genres}
            selectedGenre={filters.genre}
            showFilters={false}
            onToggleFilters={() => {}}
            onGenreSelect={handleGenreSelect}
            onClearFilters={handleClearFilters}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Search Results for all tabs */}
          <TabsContent value="all" className="mt-4">
            <SearchResults
              beats={beats}
              producers={producers}
              activeTab={activeTab}
              isLoading={isLoading}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={loadMoreBeats}
              showNoResults={showNoResults}
              searchTerm={searchTerm}
            />
          </TabsContent>

          <TabsContent value="beats" className="mt-4">
            <SearchResults
              beats={beats}
              producers={[]}
              activeTab={activeTab}
              isLoading={isLoadingBeats}
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              onLoadMore={loadMoreBeats}
              showNoResults={showNoResults && beats.length === 0}
              searchTerm={searchTerm}
            />
          </TabsContent>

          <TabsContent value="producers" className="mt-4">
            <SearchResults
              beats={[]}
              producers={producers}
              activeTab={activeTab}
              isLoading={isLoadingProducers}
              showNoResults={showNoResults && producers.length === 0}
              searchTerm={searchTerm}
            />
          </TabsContent>
        </Tabs>

        {/* Popular Searches (when no search term) */}
        {!searchTerm && !Object.keys(filters).some(key => filters[key]) && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {popularTerms.map((term) => (
                <button
                  key={term}
                  className="px-3 py-1 text-xs sm:text-sm bg-muted rounded-full hover:bg-muted/80 transition-colors"
                  onClick={() => updateSearchTerm(term)}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
