
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
import { useCriticalBeats } from "@/hooks/useCriticalBeats";
import { useEffect } from "react";

const Home = () => {
  const { essentialBeats, circuitBreakerOpen, hasCache } = useCriticalBeats();

  useEffect(() => {
    // Performance telemetry
    console.log('Home page loaded with beats:', essentialBeats.length);
    if (circuitBreakerOpen) {
      console.warn('Circuit breaker active - using fallback data');
    }
  }, [essentialBeats.length, circuitBreakerOpen]);

  return (
    <MainLayoutWithPlayer activeTab="home">
      <div className="container mx-auto px-2 xs:px-4 sm:px-6 py-6 space-y-12">
        {/* Critical path: Featured beat loads first */}
        <FeaturedBeat />
        
        {/* Essential navigation */}
        <GenreQuickLinks />
        
        {/* Core content: Only render after essential beats are available */}
        {essentialBeats.length > 0 && (
          <>
            <TrendingBeats />
            <TopProducers />
            <WeeklyPicks />
            <NewBeats />
            <FeaturedPlaylists />
            <RecommendedBeats />
            <ProducerOfWeek />
            <PremiumSection />
          </>
        )}

        {/* Fallback state indicator */}
        {circuitBreakerOpen && hasCache && (
          <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg">
            Using cached content due to connection issues. Retrying automatically...
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Home;
