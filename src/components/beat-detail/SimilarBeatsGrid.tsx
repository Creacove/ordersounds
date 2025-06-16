
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Beat } from "@/types";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";

interface SimilarBeatsGridProps {
  currentBeatId: string;
  genre: string;
  producerId: string;
}

export const SimilarBeatsGrid = ({ currentBeatId, genre, producerId }: SimilarBeatsGridProps) => {
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilarBeats = async () => {
      try {
        // First try to get beats from the same genre
        let { data: genreBeats, error: genreError } = await supabase
          .from('beats')
          .select(`
            id, title, producer_id, cover_image, audio_preview,
            basic_license_price_local, basic_license_price_diaspora,
            genre, track_type, bpm, tags, upload_date,
            favorites_count, purchase_count, status,
            users (full_name, stage_name)
          `)
          .eq('status', 'published')
          .eq('genre', genre)
          .neq('id', currentBeatId)
          .limit(8);

        if (genreError) throw genreError;

        // If we don't have enough beats from the same genre, get more from the same producer
        if (!genreBeats || genreBeats.length < 4) {
          const { data: producerBeats, error: producerError } = await supabase
            .from('beats')
            .select(`
              id, title, producer_id, cover_image, audio_preview,
              basic_license_price_local, basic_license_price_diaspora,
              genre, track_type, bpm, tags, upload_date,
              favorites_count, purchase_count, status,
              users (full_name, stage_name)
            `)
            .eq('status', 'published')
            .eq('producer_id', producerId)
            .neq('id', currentBeatId)
            .limit(4);

          if (producerError) throw producerError;

          // Combine and deduplicate
          const combined = [...(genreBeats || []), ...(producerBeats || [])];
          const unique = combined.filter((beat, index, self) => 
            index === self.findIndex(b => b.id === beat.id)
          );
          genreBeats = unique.slice(0, 8);
        }

        const mappedBeats = genreBeats?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        setSimilarBeats(mappedBeats);
      } catch (error) {
        console.error('Error fetching similar beats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarBeats();
  }, [currentBeatId, genre, producerId]);

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Similar Beats</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (similarBeats.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">Similar Beats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {similarBeats.map((beat) => (
          <BeatCardCompact key={beat.id} beat={beat} />
        ))}
      </div>
    </div>
  );
};
