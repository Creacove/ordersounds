
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
import { useProducers } from "@/hooks/useProducers";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Flame,
  ListMusic,
  ArrowRight,
  Star,
  Search,
  Calendar,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { toast } from "sonner";

export default function IndexPage() {
  const { user } = useAuth();
  const { 
    beats, 
    isLoading: isLoadingBeats, 
    trendingBeats, 
    newBeats, 
    weeklyPicks, 
    featuredBeat, 
    isOffline,
    loadingError,
    retryFetchBeats
  } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const { prefetchProducers } = useProducers();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Preload producers data when the page loads
  useEffect(() => {
    // This will trigger the producers data fetch in the background
    prefetchProducers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    if (playlists.length > 0) {
      setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 4));
    }
  }, [playlists]);

  // Handle manual refresh
  const handleRefreshBeats = () => {
    toast.info("Refreshing beats...");
    retryFetchBeats();
  };

  return (
    <MainLayoutWithPlayer>
      <div className="pb-8 px-0 mx-0">
        {isOffline && (
          <div className="bg-yellow-100 p-3 mb-4 rounded-lg flex items-center gap-2 text-yellow-800">
            <WifiOff className="h-4 w-4" />
            <span className="text-sm">You're currently offline. Some features may be limited.</span>
          </div>
        )}

        {loadingError && !isOffline && (
          <div className="bg-red-100 p-3 mb-4 rounded-lg flex items-center justify-between text-red-800">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="text-sm">Failed to load beats. Please check your connection.</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-800 hover:text-red-900 hover:bg-red-200"
              onClick={handleRefreshBeats}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}

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

        {featuredBeat ? (
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
        ) : (!isLoadingBeats && trendingBeats.length > 0) ? (
          <section className="mb-6 px-0 mx-0">
            <SectionTitle 
              title="Featured Beat" 
              icon={<Star className="h-5 w-5" />}
              badge="Today's Pick"
            />
            
            <div className="mt-3">
              <BeatCard key={trendingBeats[0].id} beat={{...trendingBeats[0], is_featured: true}} featured={true} />
            </div>
          </section>
        ) : null}

        <section className="mb-6 px-0 mx-0">
          <SectionTitle 
            title="Producer of the Week" 
            icon={<Star className="h-5 w-5" />}
            badge="Featured"
          />
          <div className="mt-3">
            <ProducerOfWeek />
          </div>
        </section>

        {/* Recommended Beats section */}
        <RecommendedBeats />

        <section className="mb-6 px-0 mx-0">
          <SectionTitle 
            title="Trending Beats" 
            icon={<TrendingUp className="h-5 w-5" />} 
            badge="Updated Hourly"
          />
          {trendingBeats.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {trendingBeats.slice(0, 8).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>No trending beats available at the moment.</p>
            </div>
          )}
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
            {weeklyPicks.length > 0 ? (
              weeklyPicks.slice(0, 8).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))
            ) : trendingBeats.length > 0 ? (
              trendingBeats.slice(0, 8).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))
            ) : (
              <div className="col-span-2 py-10 text-center text-muted-foreground">
                <p>No weekly picks available at the moment.</p>
              </div>
            )}
          </div>
        </section>

        <section className="mb-6 px-0 mx-0">
          <SectionTitle 
            title="New Releases" 
            icon={<Flame className="h-5 w-5" />}
          />
          {newBeats.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {newBeats.slice(0, 8).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>No new releases available at the moment.</p>
            </div>
          )}
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
          {featuredPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {featuredPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              <p>No featured playlists available at the moment.</p>
            </div>
          )}
        </section>
      </div>
    </MainLayoutWithPlayer>
  );
}
