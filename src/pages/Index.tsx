import { useState, useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useBeats } from "@/hooks/useBeats";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Flame,
  ListMusic,
  ArrowRight,
  Star,
  CheckCircle,
  Search,
  Calendar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User, Beat } from "@/types";

export default function IndexPage() {
  const { user } = useAuth();
  const { beats, isLoading: isLoadingBeats, trendingBeats, newBeats, weeklyPicks, featuredBeat } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [producerOfWeek, setProducerOfWeek] = useState<User | null>(null);
  const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

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
          const producer: User = {
            id: data[0].id,
            email: data[0].email,
            role: data[0].role as 'buyer' | 'producer',
            name: data[0].full_name || data[0].stage_name || '',
            avatar_url: data[0].profile_picture,
            bio: data[0].bio,
            created_at: data[0].created_date,
            country: data[0].country,
            producer_name: data[0].stage_name,
            updated_at: data[0].created_date,
            default_currency: 'NGN' as 'NGN' | 'USD'
          };
          
          setProducerOfWeek(producer);
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
    if (playlists.length > 0) {
      setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 4));
    }
  }, [playlists]);

  return (
    <MainLayoutWithPlayer>
      <div className="pb-8">
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Search for beats, producers, genres..."
                className="pr-12 py-6 h-14 text-base rounded-l-lg border-r-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                className="h-14 px-5 rounded-l-none bg-primary"
              >
                <Search className="mr-2 h-5 w-5" />
                <span>Search</span>
              </Button>
            </div>
          </form>
        </div>

        {featuredBeat && (
          <section className="mb-6">
            <SectionTitle 
              title="Featured Beat" 
              icon={<Star className="h-5 w-5" />}
              badge="Today's Pick"
            />
            
            <div className="mt-3">
              <BeatCard key={featuredBeat.id} beat={featuredBeat} featured={true} />
            </div>
          </section>
        )}

        {producerOfWeek && (
          <section className="mb-6">
            <SectionTitle 
              title="Producer of the Week" 
              icon={<Star className="h-5 w-5" />}
              badge="Featured"
            />
            
            <div className="bg-card rounded-lg border overflow-hidden mt-3">
              <div className="relative w-full aspect-video max-h-80 bg-gray-900">
                <img 
                  src={producerOfWeek.avatar_url || "/placeholder.svg"} 
                  alt={producerOfWeek.name} 
                  className="w-full h-full object-cover opacity-75"
                />
                
                <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-white uppercase">
                      {producerOfWeek.producer_name || producerOfWeek.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-purple-900/70 text-white text-xs px-2 py-1 rounded-full">
                      <CheckCircle size={12} />
                      <span>Verified</span>
                    </div>
                  </div>
                  
                  <p className="text-white/80 text-sm mt-1">
                    {producerBeats.length} beats sold • {Math.floor(Math.random() * 20)}k followers
                  </p>
                </div>
              </div>
              
              <div className="p-4">
                <p className="text-muted-foreground mb-4">
                  {producerOfWeek.bio || `Award-winning producer specializing in ${producerBeats[0]?.genre || 'beats'}. Worked with top artists across ${producerOfWeek.country || 'the world'} and beyond.`}
                </p>
                
                <Button asChild className="w-full">
                  <Link to={`/producer/${producerOfWeek.id}`}>
                    Follow Producer
                  </Link>
                </Button>
              </div>
            </div>
            
            <div className="mt-3 grid grid-cols-2 gap-2">
              {producerBeats.length > 0 ? (
                producerBeats.map((beat) => (
                  <BeatCardCompact key={beat.id} beat={beat} />
                ))
              ) : (
                <div className="col-span-full flex items-center justify-center h-full bg-card rounded-lg border p-4">
                  <p className="text-muted-foreground">No beats available from this producer yet.</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/producer/${producerOfWeek.id}`}>
                  View all beats <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        <section className="mb-6">
          <SectionTitle 
            title="Trending Beats" 
            icon={<TrendingUp className="h-5 w-5" />} 
            badge="Updated Daily"
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {trendingBeats.slice(0, 8).map((beat) => (
              <BeatCardCompact key={beat.id} beat={beat} />
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/trending">
                View all trending <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle 
            title="Weekly Picks" 
            icon={<Calendar className="h-5 w-5" />}
            badge="Updated Weekly"
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {weeklyPicks.slice(0, 8).map((beat) => (
              <BeatCardCompact key={beat.id} beat={beat} />
            ))}
            {weeklyPicks.length === 0 && trendingBeats.slice(10, 14).map((beat) => (
              <BeatCardCompact key={beat.id} beat={beat} />
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionTitle 
            title="New Releases" 
            icon={<Flame className="h-5 w-5" />}
          />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {newBeats.slice(0, 8).map((beat) => (
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

        <section className="mb-6">
          <SectionTitle title="Featured Playlists" icon={<ListMusic className="h-5 w-5" />} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {featuredPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      </div>
    </MainLayoutWithPlayer>
  );
}
