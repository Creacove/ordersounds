
import { useEffect, useState, useMemo } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useLocation } from "react-router-dom";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchBeatsByGenre, fetchAllGenres } from "@/services/beats/optimizedGenreService";
import { fetchAllBeats } from "@/services/beats/queryService";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";

export default function Genres() {
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(window.innerWidth < 768 ? 'list' : 'grid');
  const location = useLocation();
  const { user } = useAuth();
  
  // Fetch all genres for the filter
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: fetchAllGenres,
    staleTime: 30 * 60 * 1000, // Cache genres for 30 minutes
    gcTime: 60 * 60 * 1000,
  });

  // Smart genre-specific or all beats query
  const { data: beats = [], isLoading } = useQuery({
    queryKey: selectedGenre ? ['beats-by-genre', selectedGenre] : ['all-beats-for-genres'],
    queryFn: () => selectedGenre 
      ? fetchBeatsByGenre(selectedGenre, 100)
      : fetchAllBeats({ limit: 100, includeDrafts: false }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: keepPreviousData,
  }) as { data: Beat[], isLoading: boolean };

  useEffect(() => {
    // Get genre from URL query parameter if present
    const queryParams = new URLSearchParams(location.search);
    const genreParam = queryParams.get('genre');
    if (genreParam) {
      setSelectedGenre(genreParam);
      document.title = `${genreParam} Beats | OrderSOUNDS`;
    } else {
      document.title = "Genres | OrderSOUNDS";
    }
    
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'list' : 'grid');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.search]);

  // Memoized filtered beats (only when showing all beats)
  const filteredBeats = useMemo(() => {
    if (selectedGenre) return beats; // Already filtered by query
    return beats;
  }, [beats, selectedGenre]);

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">
          {selectedGenre ? `${selectedGenre} Beats` : 'Explore by Genre'}
        </h1>
        
        {/* Genre filters - scrollable on mobile */}
        <div className="flex overflow-x-auto pb-2 mb-8 gap-2 hide-scrollbar">
          <Badge 
            variant={selectedGenre === null ? "default" : "outline"}
            className="px-4 py-2 cursor-pointer hover:bg-purple-500 transition-colors flex-shrink-0"
            onClick={() => setSelectedGenre(null)}
          >
            All
          </Badge>
          
          {genres.map(genre => (
            <Badge 
              key={genre} 
              variant={selectedGenre === genre ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer hover:bg-purple-500 transition-colors flex-shrink-0"
              onClick={() => setSelectedGenre(genre)}
            >
              {genre}
            </Badge>
          ))}
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBeats.map((beat) => (
              <BeatCard 
                key={beat.id} 
                beat={beat} 
                isFavorite={isFavorite(beat.id)}
                isInCart={isInCart(beat.id)}
                isPurchased={isPurchased(beat.id)}
                onToggleFavorite={user ? toggleFavorite : undefined}
              />
            ))}
            {filteredBeats.length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No beats found for this genre.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBeats.map((beat) => (
              <BeatListItem 
                key={beat.id} 
                beat={beat} 
                isFavorite={isFavorite(beat.id)}
                isInCart={isInCart(beat.id)}
                isPurchased={isPurchased(beat.id)}
                onToggleFavorite={user ? toggleFavorite : undefined}
              />
            ))}
            {filteredBeats.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No beats found for this genre.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
