
import { TrendingBeats } from "@/components/marketplace/TrendingBeats";
import { WeeklyPicks } from "@/components/marketplace/WeeklyPicks";
import { ProducerOfWeek } from "@/components/marketplace/ProducerOfWeek";
import { RecommendedBeats } from "@/components/marketplace/RecommendedBeats";
import { TopProducers } from "@/components/marketplace/TopProducers";
import { FeaturedPlaylists } from "@/components/marketplace/FeaturedPlaylists";
import { PremiumSection } from "@/components/marketplace/PremiumSection";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { NewBeats } from "@/components/marketplace/NewBeats";

const Home = () => {
  return (
    <MainLayoutWithPlayer activeTab="home">
      <div className="container py-6 space-y-12">
        <TrendingBeats />
        <TopProducers />
        <WeeklyPicks />
        <NewBeats />
        <FeaturedPlaylists />
        <RecommendedBeats />
        <ProducerOfWeek />
        <PremiumSection />
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Home;
