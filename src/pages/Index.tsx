
import { useState, useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
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
  Loader2
} from "lucide-react";
import { Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { toast } from "sonner";
import { ConnectionErrorBoundary } from "@/components/errors/ConnectionErrorBoundary";
import { useSupabaseConnection } from "@/hooks/useSupabaseConnection";

const fallbackFeaturedBeat: Beat = {
  id: "fallback-featured",
  title: "Featured Demo Beat",
  producer_id: "demo-producer",
  producer_name: "Demo Producer",
  cover_image_url: "/placeholder.svg",
  preview_url: "",
  full_track_url: "",
  basic_license_price_local: 5000,
  basic_license_price_diaspora: 15,
  genre: "Afrobeat",
  track_type: "Single",
  bpm: 100,
  status: "published",
  is_featured: true,
  created_at: new Date().toISOString(),
  tags: ["demo", "featured"],
  favorites_count: 0,
  purchase_count: 0,
};

export default function IndexPage() {
  const { user, forceUserDataRefresh } = useAuth();
  const { beats, isLoading: isLoadingBeats, trendingBeats, newBeats, weeklyPicks, featuredBeat, fetchBeats, forceRefreshBeats } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const { prefetchProducers } = useProducers();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userDataError, setUserDataError] = useState(false);
  const { isConnected } = useSupabaseConnection();
  const navigate = useNavigate();

  const displayedFeaturedBeat = featuredBeat || fallbackFeaturedBeat;

  useEffect(() => {
    if (user && (!user.role || !user.name)) {
      console.log("Incomplete user data detected, may need refresh");
      setUserDataError(true);
    } else {
      setUserDataError(false);
    }
  }, [user]);

  useEffect(() => {
    prefetchProducers();
  }, [prefetchProducers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRefreshData = async () => {
    setIsRefreshing(true);
    
    try {
      if (userDataError && user) {
        const userRefreshed = await forceUserDataRefresh();
        if (userRefreshed) {
          console.log("User data refreshed successfully");
        }
      }
      
      await forceRefreshBeats();
      console.log("Content refreshed successfully");
      setUserDataError(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (playlists.length > 0) {
      setFeaturedPlaylists(playlists.filter(p => p.is_public).slice(0, 4));
    }
  }, [playlists]);

  return (
    <MainLayoutWithPlayer>
      <ConnectionErrorBoundary
        onRetry={handleRefreshData}
        showAlert={false} // Never show connection alerts to users
      >
        <div className="container mx-auto px-2 xs:px-4 sm:px-6 pb-8">
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

          {displayedFeaturedBeat && (
            <section className="mb-6">
              <SectionTitle 
                title="Featured Beat" 
                icon={<Star className="h-5 w-5" />}
                badge="Today's Pick"
              />
              
              <div className="mt-3">
                <BeatCard 
                  key={displayedFeaturedBeat.id} 
                  beat={displayedFeaturedBeat} 
                  featured={true} 
                />
              </div>
            </section>
          )}

          <section className="mb-6">
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

          <section className="mb-6">
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
      </ConnectionErrorBoundary>
    </MainLayoutWithPlayer>
  );
}
