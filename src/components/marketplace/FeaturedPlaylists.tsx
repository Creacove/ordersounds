
import { Link } from "react-router-dom";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Sparkles, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Playlist } from "@/types";

export const FeaturedPlaylists = () => {
  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['featured-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_public', true)
        .limit(4);
        
      if (error) throw error;
      
      // Map the data to match the Playlist type
      return (data || []).map(playlist => ({
        id: playlist.id,
        name: playlist.name,
        owner_id: playlist.owner_id,
        beats: playlist.beats,
        is_public: playlist.is_public,
        created_at: playlist.created_date || new Date().toISOString(),
        cover_image_url: playlist.cover_image
      })) as Playlist[];
    },
    staleTime: 60000, // Consider data fresh for 1 minute
    retry: 2, // Retry up to 2 times
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
    // Return empty array for failed queries instead of undefined
    placeholderData: []
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
          
          {/* Show empty placeholders if not enough playlists */}
          {playlists.length < 4 && Array(4 - playlists.length).fill(0).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-2xl bg-muted/20 border border-muted flex items-center justify-center">
              <span className="text-muted-foreground text-sm">Coming Soon</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
