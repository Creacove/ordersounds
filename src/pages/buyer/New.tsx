
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";

export default function New() {
  const { newBeats, isLoading, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { isInCart } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "New Beats | OrderSOUNDS";
  }, []);

  return (
    <MainLayout>
      <div className={cn(
        "container py-6 md:py-8",
        isMobile ? "mobile-content-padding" : ""
      )}>
        <h1 className="heading-responsive-lg mb-6 md:mb-8">New Beats</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {newBeats.map((beat) => (
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
