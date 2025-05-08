
import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchTrendingBeats } from "@/services/beats/queryService";

export const TrendingBeats = () => {
  const { data: trendingBeats = [], isLoading } = useQuery({
    queryKey: ['marked-trending-beats'],
    queryFn: () => fetchTrendingBeats(5, true), // Using the second parameter to get trending marked beats
    staleTime: 5 * 60 * 1000 // Consider data fresh for 5 minutes
  });

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
