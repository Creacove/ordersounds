
import { Link } from "react-router-dom";
import { ArrowRight, Star } from "lucide-react";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { fetchRandomBeats } from "@/services/beatsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export const WeeklyPicks = () => {
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();

  const { data: beats = [], isLoading } = useQuery({
    queryKey: ['weekly-picks'],
    queryFn: () => fetchRandomBeats(6),
    staleTime: 30 * 60 * 1000, // Consider data fresh for 30 minutes
    gcTime: 60 * 60 * 1000, // Keep in cache for 1 hour 
  });

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Weekly Picks</h2>
            <div className="bg-green-500/10 text-green-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Star size={12} />
              <span>Selected</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (beats.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Weekly Picks</h2>
          <div className="bg-green-500/10 text-green-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Star size={12} />
            <span>Selected</span>
          </div>
        </div>
        <Link to="/trending" className="text-sm text-primary hover:underline flex items-center gap-1">
          Show all
          <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {beats.map((beat) => (
          <BeatCard 
            key={beat.id} 
            beat={beat}
            onToggleFavorite={toggleFavorite}
            isFavorite={isFavorite(beat.id)}
            isPurchased={isPurchased(beat.id)}
          />
        ))}
      </div>
    </section>
  );
};
