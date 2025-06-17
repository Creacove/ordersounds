import { useState, useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { usePublicBeatsQuery } from "@/hooks/usePublicBeatsQuery";
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
  AlertCircle
} from "lucide-react";
import { Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeekWrapper } from "@/components/marketplace/ProducerOfWeekWrapper";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  // Load beats immediately, independent of user state
  const { 
    trendingBeats, 
    newBeats, 
    weeklyPicks, 
    featuredBeat, 
    isLoading: isLoadingBeats,
    dataLoaded 
  } = usePublicBeatsQuery();
  
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const { prefetchProducers } = useProducers();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [userDataError, setUserDataError] = useState(false);
  const navigate = useNavigate();

  const displayedFeaturedBeat = featuredBeat || fallbackFeaturedBeat;

  console.log('🏠 Index page render - beats loaded:', dataLoaded, 'user:', !!user);

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
    setNetworkError(false);
    
    try {
      if (userDataError && user) {
        const userRefreshed = await forceUserDataRefresh();
        if (userRefreshed) {
          toast.success("User data refreshed successfully");
        }
      }
      
      // Note: beats now load independently, so this mainly refreshes user-specific data
      toast.success("Content refreshed successfully");
      setUserDataError(false);
    } catch (error) {
      console.error("Error refreshing data:", error);
      setNetworkError(true);
      toast.error("Failed to refresh content. Please check your connection.");
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

        {(networkError || userDataError) && (
          <Alert variant={userDataError ? "warning" : "destructive"} className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {userDataError 
                ? "User data may be incomplete. This could cause limited functionality." 
                : "Connection issues detected. Some content may not be available."}
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2" 
                onClick={handleRefreshData}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {userDataError ? "Refresh User Data" : "Retry"}
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

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
            title="Trending Beats" 
            icon={<TrendingUp className="h-5 w-5" />} 
            badge="Updated Hourly"
          />
          {isLoadingBeats ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {trendingBeats.slice(0, 8).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
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

        <section className="mb-6">
          <SectionTitle 
            title="Weekly Picks" 
            icon={<Calendar className="h-5 w-5" />}
            badge="Updated Weekly"
          />
          {isLoadingBeats ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {weeklyPicks.slice(0, 6).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <SectionTitle 
            title="New Releases" 
            icon={<Flame className="h-5 w-5" />}
          />
          {isLoadingBeats ? (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {newBeats.slice(0, 6).map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
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

        <RecommendedBeats />

        <section className="mb-6">
          <SectionTitle 
            title="Producer of the Week" 
            icon={<Star className="h-5 w-5" />}
            badge="Featured"
          />
          <div className="mt-3">
            <ProducerOfWeekWrapper />
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
