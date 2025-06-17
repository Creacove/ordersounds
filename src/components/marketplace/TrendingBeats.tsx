
import { Link } from "react-router-dom";
import { TrendingUp, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCardCompact } from "./BeatCardCompact";
import { useCriticalBeats } from "@/hooks/useCriticalBeats";

export const TrendingBeats = () => {
  const { trendingBeats, isLoading } = useCriticalBeats();

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
