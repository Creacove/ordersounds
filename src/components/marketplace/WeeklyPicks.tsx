
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";

export const WeeklyPicks = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();

  useEffect(() => {
    let mounted = true;

    const loadWeeklyPicks = async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(`
            id,
            title,
            producer_id,
            users (
              full_name,
              stage_name
            ),
            cover_image,
            audio_preview,
            basic_license_price_local,
            basic_license_price_diaspora,
            genre,
            track_type,
            bpm,
            tags,
            upload_date,
            favorites_count,
            purchase_count,
            status,
            is_weekly_pick
          `)
          .eq('status', 'published')
          .eq('is_weekly_pick', true)
          .limit(6);

        if (error) throw error;

        if (mounted && data) {
          const mappedBeats = data.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
          setBeats(mappedBeats);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error loading weekly picks:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadWeeklyPicks();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="bg-card/50 p-4 sm:p-6 rounded-lg mb-10 border">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Weekly Picks</h2>
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              <Star size={12} className="mr-1" /> Selected
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-3 bg-background/50 rounded-md border border-border/50 flex items-center gap-3">
              <Skeleton className="h-14 w-14 rounded" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
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
    <section className="bg-card/50 p-4 sm:p-6 rounded-lg mb-10 border">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Weekly Picks</h2>
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Star size={12} className="mr-1" /> Selected
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {beats.map((beat) => (
          <div 
            key={beat.id} 
            className="p-3 bg-background/50 rounded-md border border-border/50 flex items-center gap-3 hover:bg-background/80 transition-colors cursor-pointer"
            onClick={() => window.location.href = `/beat/${beat.id}`}
          >
            <div className="w-12 h-12 md:w-14 md:h-14 rounded overflow-hidden flex-shrink-0 relative">
              <img 
                src={beat.cover_image_url} 
                alt={beat.title}
                className="w-full h-full object-cover" 
              />
              {isPurchased(beat.id) && (
                <div className="absolute top-0 left-0 bg-green-500/90 text-white text-[10px] px-1 py-0.5 rounded-br-sm">
                  Owned
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-sm md:text-base truncate">{beat.title}</h3>
              <p className="text-xs text-muted-foreground truncate">
                {beat.producer_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 truncate">
                  {beat.genre}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
