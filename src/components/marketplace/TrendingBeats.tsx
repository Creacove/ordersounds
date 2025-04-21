
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { fetchRandomBeats } from "@/services/beatsService";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

export const TrendingBeats = () => {
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();

  const { data: beats = [], isLoading } = useQuery({
    queryKey: ['trending-beats'],
    queryFn: () => fetchRandomBeats(5),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (renamed from cacheTime)
  });

  if (isLoading) {
    return (
      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Trending Beats</h2>
            <div className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <Flame size={12} />
              <span>Hot</span>
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
          <h2 className="text-lg font-semibold">Trending Beats</h2>
          <div className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
            <Flame size={12} />
            <span>Hot</span>
          </div>
        </div>
        <Link to="/trending" className="text-sm text-primary hover:underline flex items-center gap-1">
          Show all
          <ArrowRight size={14} />
        </Link>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
