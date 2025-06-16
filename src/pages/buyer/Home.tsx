
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useSimpleBeats } from "@/hooks/useSimpleBeats";
import { useCart } from "@/context/CartContext";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, TrendingUp, Sparkles, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Beat } from "@/types";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";

const Home = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const { beats, isLoading, error } = useSimpleBeats();
  const { isInCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  
  // Progressive loading states
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  // Load trending beats after main content loads
  useEffect(() => {
    if (!isLoading && beats.length > 0) {
      const loadTrendingBeats = async () => {
        try {
          const { data } = await supabase
            .from('beats')
            .select(`
              *,
              users!beats_producer_id_fkey (
                full_name,
                stage_name
              )
            `)
            .eq('status', 'published')
            .eq('is_trending', true)
            .order('upload_date', { ascending: false })
            .limit(8);

          if (data) {
            const mapped = data.map(mapSupabaseBeatToBeat);
            setTrendingBeats(mapped);
            // Set first trending beat as featured
            if (mapped.length > 0) {
              setFeaturedBeat(mapped[0]);
            }
          }
        } catch (err) {
          console.error('Error loading trending beats:', err);
        } finally {
          setLoadingTrending(false);
        }
      };

      loadTrendingBeats();
    }
  }, [isLoading, beats.length]);

  // Load new beats after trending loads
  useEffect(() => {
    if (!loadingTrending) {
      const loadNewBeats = async () => {
        try {
          const { data } = await supabase
            .from('beats')
            .select(`
              *,
              users!beats_producer_id_fkey (
                full_name,
                stage_name
              )
            `)
            .eq('status', 'published')
            .order('upload_date', { ascending: false })
            .limit(6);

          if (data) {
            setNewBeats(data.map(mapSupabaseBeatToBeat));
          }
        } catch (err) {
          console.error('Error loading new beats:', err);
        } finally {
          setLoadingNew(false);
        }
      };

      loadNewBeats();
    }
  }, [loadingTrending]);

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
    // Simple check - can be enhanced later
    return false;
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
    <MainLayoutWithPlayer activeTab="home">
      <div className="container mx-auto px-2 xs:px-4 sm:px-6 py-6 space-y-8">
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

        {/* Featured Beat */}
        {featuredBeat && (
          <section className="mb-8">
            <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${featuredBeat.cover_image_url || '/placeholder.svg'})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
              </div>
              
              <div className="relative h-full flex flex-col justify-end p-6 text-white">
                <div className="bg-purple-600 text-white text-xs px-3 py-1 rounded-full w-fit mb-3">
                  Featured Beat
                </div>
                <h1 className="text-3xl font-bold mb-1">{featuredBeat.title}</h1>
                <p className="text-base opacity-90 mb-2">{featuredBeat.producer_name}</p>
                <div className="flex items-center gap-4">
                  <p className="text-sm opacity-70">{featuredBeat.bpm} BPM • {featuredBeat.genre}</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <Link to={`/beat/${featuredBeat.id}`}>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Listen now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Main Beats Grid */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Latest Beats</h2>
            <Link to="/search" className="text-sm text-purple-500 hover:text-purple-600">
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array(10).fill(0).map((_, i) => (
                <div key={i} className="h-52 rounded-lg bg-muted/40 animate-pulse"></div>
              ))}
            </div>
          ) : beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {beats.slice(0, 10).map((beat) => (
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
              <p className="text-muted-foreground">No beats found</p>
              <Button onClick={handleRefresh} className="mt-4 gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          )}
        </section>

        {/* Trending Section - Loads progressively */}
        {!loadingTrending && trendingBeats.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-bold">Trending</h2>
              </div>
              <Link to="/trending" className="text-sm text-purple-500 hover:text-purple-600">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {trendingBeats.slice(1, 9).map((beat) => (
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
          </section>
        )}

        {/* New Releases - Loads after trending */}
        {!loadingNew && newBeats.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <h2 className="text-xl font-bold">New Releases</h2>
              </div>
              <Link to="/new" className="text-sm text-purple-500 hover:text-purple-600">
                View all
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {newBeats.slice(0, 8).map((beat) => (
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
          </section>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Home;
