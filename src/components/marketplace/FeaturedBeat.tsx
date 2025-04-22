
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchFeaturedBeats } from "@/services/beats/queryService";

export const FeaturedBeat = () => {
  const { data: featuredBeat } = useQuery({
    queryKey: ['featured-beat'],
    queryFn: async () => {
      const beats = await fetchFeaturedBeats(1);
      return beats[0];
    }
  });

  if (!featuredBeat) return null;

  return (
    <section className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${featuredBeat.cover_image_url || '/placeholder.svg'})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
      </div>
      
      <div className="relative h-full flex flex-col justify-end p-8 text-white">
        <div className="bg-purple-500 text-white text-sm px-3 py-1 rounded-full w-fit mb-4">
          Featured Beat
        </div>
        <h1 className="text-4xl font-bold mb-2">{featuredBeat.title}</h1>
        <p className="text-lg opacity-90 mb-4">{featuredBeat.producer_name}</p>
        <div className="flex items-center gap-4">
          <p className="text-sm opacity-70">{featuredBeat.bpm} BPM • {featuredBeat.genre}</p>
        </div>
        <div className="flex gap-4 mt-6">
          <Link to={`/beat/${featuredBeat.id}`}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Listen now
            </Button>
          </Link>
          <Link to={`/beat/${featuredBeat.id}`}>
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              View details
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
