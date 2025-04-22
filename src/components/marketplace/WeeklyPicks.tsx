
import { Link } from "react-router-dom";
import { Star, ChevronRight } from "lucide-react";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { useQuery } from "@tanstack/react-query";
import { BeatCardCompact } from "./BeatCardCompact";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";

export const WeeklyPicks = () => {
  const { data: weeklyPicks = [], isLoading } = useQuery({
    queryKey: ['weekly-picks'],
    queryFn: async () => {
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
        .limit(5);

      if (error) throw error;

      return data.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
  });

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle 
          title="Weekly Picks" 
          icon={<Star className="w-5 h-5 text-purple-500" />}
          badge="Selected"
        />
        <Link to="/weekly" className="flex items-center text-sm text-muted-foreground hover:text-primary">
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
          {weeklyPicks.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </section>
  );
};
