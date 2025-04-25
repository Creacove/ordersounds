
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BeatCard } from "@/components/ui/BeatCard";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { fetchTrendingBeats } from "@/services/beats/queryService";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";

export default function Trending() {
  const [displayCount, setDisplayCount] = useState(30);
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { user } = useAuth();
  
  const { data: trendingBeats = [], isLoading } = useQuery({
    queryKey: ['trending-beats', displayCount],
    queryFn: () => fetchTrendingBeats(displayCount),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  useEffect(() => {
    document.title = "Trending Beats | OrderSOUNDS";
  }, []);

  const loadMoreBeats = () => {
    setDisplayCount(prevCount => prevCount + 30);
  };

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Trending Beats</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover the most popular beats based on plays and engagement</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(30)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {trendingBeats.map((beat) => (
                <BeatCard 
                  key={beat.id} 
                  beat={beat} 
                  onToggleFavorite={user ? toggleFavorite : undefined}
                  isFavorite={isFavorite(beat.id)}
                  isInCart={isInCart(beat.id)}
                  isPurchased={isPurchased(beat.id)}
                />
              ))}
            </div>
            
            {trendingBeats.length >= displayCount && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={loadMoreBeats}
                  className="gap-2"
                >
                  See More <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {trendingBeats.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No beats available at the moment.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
