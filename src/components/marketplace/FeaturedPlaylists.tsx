
import { Link } from "react-router-dom";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Playlist } from "@/types";
import { uniqueToast } from "@/lib/toast";

export const FeaturedPlaylists = () => {
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['featured-playlists'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('is_public', true)
          .limit(4);
          
        if (error) {
          console.error("Error fetching playlists:", error);
          uniqueToast.error("Failed to load playlists");
          return [];
        }
        
        // Map the data to match the Playlist type
        return (data || []).map(playlist => ({
          ...playlist,
          created_at: playlist.created_date || new Date().toISOString(),
        })) as Playlist[];
      } catch (err) {
        console.error("Exception fetching playlists:", err);
        uniqueToast.error("Failed to load playlists");
        return [];
      }
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {playlists?.map((playlist) => (
            <PlaylistCard key={playlist.id} playlist={playlist} />
          ))}
        </div>
      )}
    </section>
  );
};
