
import { Link } from "react-router-dom";
import { Sparkles, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchNewBeats } from "@/services/beats/queryService";

export const NewBeats = () => {
  const { data: newBeats = [], isLoading } = useQuery({
    queryKey: ['new-beats-homepage'],
    queryFn: () => fetchNewBeats(5)
  });

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle 
          title="New Beats" 
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
          badge="Fresh"
        />
        <Link to="/new" className="flex items-center text-sm text-muted-foreground hover:text-primary">
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
          {newBeats.slice(0, 5).map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
};
