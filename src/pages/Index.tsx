
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
  AlertCircle,
  WifiOff
} from "lucide-react";
import { Beat } from "@/types";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Fallback featured beat for when network fails
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
  track_type: "Single", // Added missing required property
  bpm: 100,
  status: "published",
  is_featured: true,
  created_at: new Date().toISOString(),
  tags: ["demo", "featured"],
  favorites_count: 0, // Added missing required property
  purchase_count: 0, // Added missing required property
};

export default function IndexPage() {
  const { user, forceUserDataRefresh } = useAuth();
  const { 
    beats, 
    isLoading: isLoadingBeats, 
    trendingBeats, 
    newBeats, 
    weeklyPicks, 
    featuredBeat, 
    fetchBeats,
    forceRefresh,
    isOffline,
    dataFreshness,
    fetchInProgress
  } = useBeats();
  const { playlists, isLoading: isLoadingPlaylists } = usePlaylists();
  const { prefetchProducers } = useProducers();
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userDataError, setUserDataError] = useState(false);
  const navigate = useNavigate();

  const displayedFeaturedBeat = featuredBeat || fallbackFeaturedBeat;

  // Check for user data issues on page load
  useEffect(() => {
    if (user && (!user.role || !user.name)) {
      console.log("Incomplete user data detected, may need refresh");
      setUserDataError(true);
    } else {
      setUserDataError(false);
    }
  }, [user]);

  // Load producers data in the background once content is loaded
  useEffect(() => {
    if (!isLoadingBeats && beats.length > 0) {
      // This will trigger the producers data fetch in the background
      // after main content is loaded
      prefetchProducers();
    }
  }, [prefetchProducers, isLoadingBeats, beats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Manual refresh function that users can trigger
  const handleRefreshData = async () => {
    if (fetchInProgress) {
      toast.info("Refresh already in progress...");
      return;
    }
    
    try {
      // First refresh user data if needed
      if (userDataError && user) {
        toast.info("Refreshing user data...");
        const userRefreshed = await forceUserDataRefresh();
        if (userRefreshed) {
          toast.success("User data refreshed successfully");
          setUserDataError(false);
        }
      }
      
      // Then refresh beats
      await forceRefresh();
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh content. Please check your connection.");
    }
  };

  useEffect(() => {
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

        {/* Unified status alert */}
        {(isOffline || userDataError || dataFreshness === 'stale' || dataFreshness === 'expired') && (
          <Alert 
            variant={
              isOffline ? "destructive" : 
              userDataError ? "warning" : 
              dataFreshness === 'expired' ? "destructive" : 
              "default"
            } 
            className="mb-6"
          >
            {isOffline && <WifiOff className="h-4 w-4" />}
            {!isOffline && <AlertCircle className="h-4 w-4" />}
            <AlertDescription className="flex items-center justify-between">
              <span>
                {isOffline && "You're offline. Using cached content."}
                {!isOffline && userDataError && "User data may be incomplete. This could cause limited functionality."}
                {!isOffline && !userDataError && dataFreshness === 'expired' && "Content is outdated. Click refresh for the latest."}
                {!isOffline && !userDataError && dataFreshness === 'stale' && "Content may be outdated. Consider refreshing."}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshData}
                disabled={isOffline || fetchInProgress}
              >
                {fetchInProgress ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {userDataError ? "Refresh User Data" : "Refresh Content"}
                  </>
                )}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {displayedFeaturedBeat && (
          <section className="mb-6 px-0 mx-0">
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
      </div>
    </MainLayoutWithPlayer>
  );
}
