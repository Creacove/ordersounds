
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { Badge } from "@/components/ui/badge";

export default function Genres() {
  const { beats, isLoading } = useBeats();
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  useEffect(() => {
    document.title = "Genres | Creacove";
  }, []);

  // Extract unique genres from beats
  const genres = [...new Set(beats.map(beat => beat.genre))].filter(Boolean);

  // Filter beats by selected genre
  const filteredBeats = selectedGenre 
    ? beats.filter(beat => beat.genre === selectedGenre)
    : beats;

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Explore by Genre</h1>
        
        {/* Genre filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <Badge 
            variant={selectedGenre === null ? "default" : "outline"}
            className="px-4 py-2 cursor-pointer hover:bg-purple-500 transition-colors"
            onClick={() => setSelectedGenre(null)}
          >
            All
          </Badge>
          
          {genres.map(genre => (
            <Badge 
              key={genre} 
              variant={selectedGenre === genre ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer hover:bg-purple-500 transition-colors"
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBeats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
