
import { useEffect, useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { BeatCard } from "@/components/ui/BeatCard";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchNewBeats } from "@/services/beats/queryService";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Beat } from "@/types";

export default function New() {
  const [displayCount, setDisplayCount] = useState(30);
  const { isInCart } = useCart();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { user } = useAuth();
  
  // Smart caching: Single cache key, slice client-side
  const { data: allNewBeats = [], isLoading } = useQuery({
    queryKey: ['new-beats'], // Single key regardless of display count
    queryFn: () => fetchNewBeats(200), // Fetch more upfront
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000, // Proper garbage collection
    placeholderData: keepPreviousData, // Updated syntax for TanStack Query v5
  }) as { data: Beat[], isLoading: boolean };

  // Memoized slicing - no re-computation on re-renders
  const newBeats = useMemo(() => 
    allNewBeats.slice(0, displayCount), 
    [allNewBeats, displayCount]
  );

  useEffect(() => {
    document.title = "New Beats | OrderSOUNDS";
  }, []);

  const loadMoreBeats = () => {
    setDisplayCount(prevCount => Math.min(prevCount + 30, allNewBeats.length));
  };

  const hasMore = displayCount < allNewBeats.length;

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">New Beats</h1>
          <p className="text-sm text-muted-foreground mt-1">Discover the latest beats from our producers</p>
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
              {newBeats.map((beat) => (
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
            
            {hasMore && (
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
            
            {newBeats.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No new beats available at the moment.</p>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
