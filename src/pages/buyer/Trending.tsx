
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Trending() {
  const { trendingBeats, isLoading, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { isInCart } = useCart();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    document.title = "Trending Beats | OrderSOUNDS";
  }, []);

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Trending Beats</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover the hottest beats right now</p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {trendingBeats.map((beat) => (
              <BeatCard 
                key={beat.id} 
                beat={beat} 
                onToggleFavorite={toggleFavorite}
                isFavorite={isFavorite(beat.id)}
                isInCart={isInCart(beat.id)}
                isPurchased={isPurchased(beat.id)}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
