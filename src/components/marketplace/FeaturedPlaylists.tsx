
import { Link } from "react-router-dom";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Playlist } from "@/types";

export const FeaturedPlaylists = () => {
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['featured-playlists'],
    queryFn: async () => {
      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_public', true)
        .limit(4);
        
      // Map the data to match the Playlist type
      return (data || []).map(playlist => ({
        ...playlist,
        created_at: playlist.created_date || new Date().toISOString(),
      })) as Playlist[];
    }
  });

  return (
    <section className="w-full">
      <div className="flex items-center justify-between mb-6">
        <SectionTitle 
          title="Featured Playlists" 
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
          badge="Curated"
        />
        <Link to="/playlists" className="flex items-center text-sm text-muted-foreground hover:text-primary">
          View all <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-muted/40 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {playlists?.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </section>
  );
};
