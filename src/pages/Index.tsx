
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useSimpleBeats } from "@/hooks/useSimpleBeats";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, RefreshCw } from "lucide-react";

export default function IndexPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { beats, isLoading, error } = useSimpleBeats();
  const { isInCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const isPurchased = (beatId: string): boolean => {
    return false; // Simple implementation
  };

  if (error) {
    return (
      <MainLayoutWithPlayer>
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="text-red-500 mb-4">Error loading beats: {error}</div>
          <Button onClick={handleRefresh} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="container mx-auto px-2 xs:px-4 sm:px-6 pb-8">
        {/* Search Bar */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Search for beats, producers, genres..."
                className="pr-12 py-6 h-14 text-base rounded-l-lg border-r-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button 
                type="submit" 
                className="h-14 px-5 rounded-l-none bg-primary"
              >
                <Search className="mr-2 h-5 w-5" />
                <span>Search</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Main Content */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Latest Beats</h2>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array(15).fill(0).map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
              ))}
            </div>
          ) : beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {beats.map((beat) => (
                <BeatCard 
                  key={beat.id} 
                  beat={beat}
                  isFavorite={isFavorite(beat.id)}
                  isInCart={isInCart(beat.id)}
                  isPurchased={isPurchased(beat.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No beats found</p>
              <Button onClick={handleRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          )}
        </section>
      </div>
    </MainLayoutWithPlayer>
  );
}
