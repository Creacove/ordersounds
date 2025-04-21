
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { fetchRandomBeats } from "@/services/beatsService";
import { Beat } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

export const TrendingBeats = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();

  useEffect(() => {
    const loadBeats = async () => {
      setIsLoading(true);
      const randomBeats = await fetchRandomBeats(5);
      setBeats(randomBeats);
      setIsLoading(false);
    };

    loadBeats();
  }, []);

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
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="aspect-square rounded-lg" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
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
      )}
    </section>
  );
};
