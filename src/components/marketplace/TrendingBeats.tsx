
import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchTrendingBeats } from "@/services/beats";
import { useMemo } from "react";

export const TrendingBeats = () => {
  const { data: allTrendingBeats = [], isLoading } = useQuery({
    queryKey: ['curated-trending-beats'],
    queryFn: () => fetchTrendingBeats(20), // Fetch a few more
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Proper memory management
  });

  // Memoized slice for homepage display
  const trendingBeats = useMemo(() => 
    allTrendingBeats.slice(0, 5), 
    [allTrendingBeats]
  );

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle 
          title="Trending Beats" 
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          badge="Hot"
        />
        <Link to="/trending" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {trendingBeats.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
};
