import { useState, useEffect, useRef } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useBeats } from "@/hooks/useBeats";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  TrendingUp,
  Flame,
  ListMusic,
  Plus,
  Play,
  Pause,
  ArrowRight,
  Star,
  UserCheck,
  Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export default function IndexPage() {
  const { user } = useAuth();
  const { playBeat, currentBeatId, isPlaying, togglePlayPause } = usePlayer();
  const { addToCart } = useCart();
  const { beats, isLoading: isLoadingBeats } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [producerOfWeek, setProducerOfWeek] = useState<User | null>(null);
  const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchProducerOfWeek = async () => {
      try {
        const { data, error } = await supabase
          .rpc('get_producer_of_week');

        if (error) {
          console.error('Error fetching producer of week:', error);
          return;
        }

        if (data && data.length > 0) {
          setProducerOfWeek(data[0]);
        }
      } catch (error) {
        console.error('Failed to fetch producer of week:', error);
      }
    };

    fetchProducerOfWeek();
  }, []);

  useEffect(() => {
    if (producerOfWeek && beats.length > 0) {
      const producerBeats = beats.filter(beat => beat.producer_id === producerOfWeek.id);
      setProducerBeats(producerBeats.slice(0, 4));
    }
  }, [producerOfWeek, beats]);

  useEffect(() => {
    if (beats.length > 0) {
      const trending = [...beats]
        .sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0))
        .slice(0, 8);
      setTrendingBeats(trending);

      const newReleases = [...beats]
        .sort((a, b) => new Date(b.created_at || Date.now()).getTime() - 
                         new Date(a.created_at || Date.now()).getTime())
        .slice(0, 8);
      setNewBeats(newReleases);
    }
  }, [beats]);

  useEffect(() => {
    if (playlists.length > 0) {
      setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 4));
    }
  }, [playlists]);

  const handlePlay = (beat) => {
    if (currentBeatId === beat.id) {
      togglePlayPause();
    } else {
      playBeat(beat);
    }
  };

  const handleAddToCart = (beat) => {
    addToCart(beat);
    toast.success(`${beat.title} added to cart`);
  };

  const isBeatPlaying = (beatId) => {
    return currentBeatId === beatId && isPlaying;
  };

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        {producerOfWeek && (
          <section className="mb-12">
            <SectionTitle 
              title="Producer of the Week" 
              icon={<Star className="h-5 w-5" />}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 bg-card rounded-lg border p-6 flex flex-col">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={producerOfWeek.avatar_url || producerOfWeek.profile_picture || "/placeholder.svg"} 
                      alt={producerOfWeek.name || producerOfWeek.producer_name || producerOfWeek.full_name || "Producer"} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {producerOfWeek.producer_name || producerOfWeek.name || producerOfWeek.full_name || "Producer"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {producerOfWeek.country || "Producer"}
                    </p>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4 flex-grow">
                  {producerOfWeek.bio || "Talented producer with a unique sound and amazing beats."}
                </p>
                
                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <Link to={`/producer/${producerOfWeek.id}`}>
                      View Profile
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to={`/producer/${producerOfWeek.id}`}>
                      Browse Beats
                    </Link>
                  </Button>
                </div>
              </div>
              
              <div className="col-span-1 md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                  {producerBeats.length > 0 ? (
                    producerBeats.map((beat) => (
                      <BeatCard key={beat.id} beat={beat} />
                    ))
                  ) : (
                    <div className="col-span-full flex items-center justify-center h-full bg-card rounded-lg border p-6">
                      <p className="text-muted-foreground">No beats available from this producer yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="mb-12">
          <SectionTitle title="Trending" icon={<TrendingUp className="h-5 w-5" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {trendingBeats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <SectionTitle title="New Releases" icon={<Flame className="h-5 w-5" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {newBeats.map((beat) => (
              <BeatCard key={beat.id} beat={beat} />
            ))}
          </div>
        </section>

        <section className="mb-12">
          <SectionTitle title="Featured Playlists" icon={<ListMusic className="h-5 w-5" />} />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {featuredPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      </div>
    </MainLayoutWithPlayer>
  );
}
