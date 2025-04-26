
import { useQuery } from "@tanstack/react-query";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { fetchFeaturedBeats } from "@/services/beats/queryService";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";

// Default fallback beat
const fallbackFeaturedBeat: Beat = {
  id: "fallback-featured",
  title: "Featured Beat",
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
  tags: ["featured"],
  favorites_count: 0,
  purchase_count: 0,
};

export const FeaturedBeat = () => {
  const { trendingBeats } = useBeats();
  
  // Use query with fallback value so we never return undefined
  const { data: featuredBeat } = useQuery({
    queryKey: ['featured-beat'],
    queryFn: () => fetchFeaturedBeats(1).then(beats => beats[0] || null),
    staleTime: 5 * 60 * 1000, // 5 minutes
    // Ensure we don't get undefined by providing a default
    placeholderData: () => {
      // Use first trending beat if available, otherwise fallback
      return trendingBeats.length > 0 
        ? { ...trendingBeats[0], is_featured: true } 
        : fallbackFeaturedBeat;
    }
  });
  
  // Always have a fallback even if query fails
  const displayedBeat = featuredBeat || fallbackFeaturedBeat;

  return (
    <section className="w-full mb-8">
      <BeatCard key={displayedBeat.id} beat={displayedBeat} featured={true} />
    </section>
  );
};
