import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Skeleton } from "@/components/ui/skeleton";
import { BeatCard } from "@/components/ui/BeatCard";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { ChevronDown, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Trending() {
  const { trendingBeats, isLoading, toggleFavorite, isFavorite, isPurchased, fetchBeats, isOffline } = useBeats();
  const { isInCart } = useCart();
  const [displayCount, setDisplayCount] = useState(30);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  useEffect(() => {
    document.title = "Trending Beats | OrderSOUNDS";
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchBeats();
      toast.success("Content refreshed successfully");
    } catch (error) {
      toast.error("Failed to refresh. Please try again later.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMoreBeats = () => {
    setIsLoadingMore(true);
    setDisplayCount(prevCount => prevCount + 30);
    setIsLoadingMore(false);
  };

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Trending Beats</h1>
            <p className="text-sm text-muted-foreground mt-1">Discover the hottest beats right now based on likes and plays</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        
        {isOffline && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6">
            <p className="text-amber-800 text-sm">You're currently offline. Showing cached content. Click refresh when you're back online.</p>
          </div>
        )}
        
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
              {trendingBeats.slice(0, displayCount).map((beat) => (
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
            
            {trendingBeats.length > displayCount && (
              <div className="flex justify-center mt-8">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={loadMoreBeats}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? 'Loading...' : 'See More'}
                  {!isLoadingMore && <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            )}
            
            {trendingBeats.length === 0 && (
              <div className="text-center py-10">
                <p className="text-muted-foreground">No trending beats available at the moment.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh} 
                  className="mt-4 gap-2"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
