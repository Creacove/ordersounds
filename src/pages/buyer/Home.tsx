
import { TrendingBeats } from "@/components/marketplace/TrendingBeats";
import { WeeklyPicks } from "@/components/marketplace/WeeklyPicks";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { TopProducers } from "@/components/marketplace/TopProducers";
import { FeaturedPlaylists } from "@/components/marketplace/FeaturedPlaylists";
import { PremiumSection } from "@/components/marketplace/PremiumSection";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { NewBeats } from "@/components/marketplace/NewBeats";
import { FeaturedBeat } from "@/components/marketplace/FeaturedBeat";
import { GenreQuickLinks } from "@/components/marketplace/GenreQuickLinks";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBeats } from "@/hooks/useBeats";

const Home = () => {
  const { isLoading, loadingError } = useBeats();
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Set a timeout to hide the initial loading state after 3 seconds
  // This ensures users don't have to wait too long even if data is slow
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    if (!isLoading) {
      setInitialLoading(false);
    }
  }, [isLoading]);

  return (
    <MainLayoutWithPlayer activeTab="home">
      {initialLoading ? (
        <div className="flex items-center justify-center h-[70vh]">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading beats...</p>
          </div>
        </div>
      ) : (
        <div className="container py-6 px-2 xs:px-4 sm:px-6 space-y-12">
          {loadingError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {loadingError}
              </AlertDescription>
            </Alert>
          )}
          <FeaturedBeat />
          <GenreQuickLinks />
          <TrendingBeats />
          <TopProducers />
          <WeeklyPicks />
          <NewBeats />
          <FeaturedPlaylists />
          <RecommendedBeats />
          <ProducerOfWeek />
          <PremiumSection />
        </div>
      )}
    </MainLayoutWithPlayer>
  );
};

export default Home;
