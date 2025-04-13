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
  Search,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";

export default function IndexPage() {
  const { user } = useAuth();
  const { beats, isLoading: isLoadingBeats, trendingBeats, newBeats, weeklyPicks, featuredBeat } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    console.log("IndexPage mounted - should show ProducerOfWeek");
    
    if (playlists.length > 0) {
      setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 4));
    }
  }, [playlists]);

  return (
    <MainLayoutWithPlayer>
      <div className="pb-8 px-0 mx-0">
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
          <section className="mb-6 px-0 mx-0">
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

        <section className="mb-6 px-0 mx-0 relative">
          <div className="absolute inset-0 border-2 border-red-500 pointer-events-none opacity-30 z-10"></div>
          <SectionTitle 
            title="Producer of the Week" 
            icon={<Star className="h-5 w-5" />}
            badge="Featured"
          />
          <div className="mt-3">
            <ProducerOfWeek />
          </div>
        </section>

        <RecommendedBeats />

        <section className="mb-6 px-0 mx-0">
          <SectionTitle 
            title="Trending Beats" 
            icon={<TrendingUp className="h-5 w-5" />} 
            badge="Updated Hourly"
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

        <section className="mb-6 px-0 mx-0">
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

        <section className="mb-6 px-0 mx-0">
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

        <section className="mb-6 px-0 mx-0">
          <SectionTitle title="Featured Playlists" icon={<ListMusic className="h-5 w-5" />} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            {featuredPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>

        <section className="mb-10 bg-primary/5 rounded-lg py-8 px-6">
          {user ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                Discover More Music
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Explore our vast library of beats from top producers or check out your personal recommendations.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/trending">Explore Trending</Link>
                </Button>
                <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5" asChild>
                  <Link to="/favorites">Your Favorites</Link>
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                Unlock Premium Music
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join today to access exclusive beats, save favorites, and connect with top producers.
              </p>
              <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
            </>
          )}
        </section>
      </div>
    </MainLayoutWithPlayer>
  );
}
