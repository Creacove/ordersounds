
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Calendar } from "lucide-react";
import { BeatCardCompact } from "./BeatCardCompact";
import { fetchNewBeats } from "@/services/beatsService";
import { Beat } from "@/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionTitle } from "@/components/ui/SectionTitle";

export const NewBeats = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadBeats = async () => {
      try {
        const newBeats = await fetchNewBeats(5);
        if (mounted) {
          setBeats(newBeats);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading new beats:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadBeats();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="mb-6 px-0 mx-0">
        <SectionTitle 
          title="New Releases" 
          icon={<Calendar className="h-5 w-5" />}
        />
        <div className="grid grid-cols-2 gap-2 mt-3">
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
    <section className="mb-6 px-0 mx-0">
      <SectionTitle 
        title="New Releases" 
        icon={<Calendar className="h-5 w-5" />}
      />
      <div className="grid grid-cols-2 gap-2 mt-3">
        {beats.map((beat) => (
          <BeatCardCompact key={beat.id} beat={beat} />
        ))}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/new">
            View all new releases <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};
