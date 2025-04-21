import { useState, useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Link, useNavigate } from "react-router-dom";
import {
  TrendingUp, Flame, ListMusic, ArrowRight, Star, Search,
  Calendar, RefreshCw, AlertCircle
} from "lucide-react";
import { Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchFeaturedBeat } from "@/services/beatsService";
import { toast } from "sonner";
import { NewBeats } from "@/components/marketplace/NewBeats";

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
  const { playlists } = usePlaylists();
  const { 
    beats, isLoading: isLoadingBeats, 
    trendingBeats, newBeats, weeklyPicks, 
    fetchBeats 
  } = useBeats();
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [networkError, setNetworkError] = useState(false);
  const [userDataError, setUserDataError] = useState(false);
  const [featuredPlaylists, setFeaturedPlaylists] = useState<any[]>([]);
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
      
      await fetchBeats();
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

  useEffect(() => {
    const loadFeaturedBeat = async () => {
      try {
        const beat = await fetchFeaturedBeat();
        setFeaturedBeat(beat);
      } catch (error) {
        console.error('Error loading featured beat:', error);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    loadFeaturedBeat();
  }, []);

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

        {isLoadingFeatured ? (
          <div className="mb-6 px-0 mx-0">
            <div className="h-[200px] bg-card/50 animate-pulse rounded-lg" />
          </div>
        ) : featuredBeat ? (
          <section className="mb-6 px-0 mx-0">
            <SectionTitle 
              title="Featured Beat" 
              icon={<Star className="h-5 w-5" />}
              badge="Today's Pick"
            />
            
            <div className="mt-3">
              <BeatCard 
                key={featuredBeat.id} 
                beat={featuredBeat} 
                featured={true} 
              />
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

        <NewBeats />

        <section className="mb-6 px-0 mx-0">
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
