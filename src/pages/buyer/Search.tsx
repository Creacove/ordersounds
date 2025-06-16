
import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Search, MusicIcon, UserIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/context/CartContext";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || "";
  const initialGenre = searchParams.get('genre') || "";
  
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { beats, isLoading, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { isInCart } = useCart();
  const [searchResults, setSearchResults] = useState(beats);
  const [producers, setProducers] = useState([]);
  const [loadingProducers, setLoadingProducers] = useState(true);
  const [genres, setGenres] = useState(['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop']);
  const isMobile = useIsMobile();

  // Set the search term when query parameter changes
  useEffect(() => {
    if (initialQuery) {
      setSearchTerm(initialQuery);
    }
    if (initialGenre) {
      setSelectedGenre(initialGenre);
    }
  }, [initialQuery, initialGenre]);

  useEffect(() => {
    const fetchProducers = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, stage_name, profile_picture, bio, country')
          .eq('role', 'producer')
          .limit(20);
        
        if (error) throw error;
        
        setProducers(data || []);
      } catch (error) {
        console.error('Error fetching producers:', error);
      } finally {
        setLoadingProducers(false);
      }
    };

    fetchProducers();
  }, []);

  // Extract unique genres from beats
  useEffect(() => {
    if (beats.length > 0) {
      const uniqueGenres = [...new Set(beats.map(beat => beat.genre))].filter(Boolean);
      if (uniqueGenres.length > 0) {
        setGenres(uniqueGenres);
      }
    }
  }, [beats]);

  useEffect(() => {
    if (!searchTerm.trim() && !selectedGenre) {
      setSearchResults(beats);
      return;
    }

    const term = searchTerm.toLowerCase().trim();

    const filteredResults = beats.filter(beat => {
      const matchTitle = term ? beat.title.toLowerCase().includes(term) : true;
      const matchProducer = term ? beat.producer_name.toLowerCase().includes(term) : true;
      // --- New: match TAGS as well
      const matchTags =
        term && beat.tags && Array.isArray(beat.tags)
          ? beat.tags.some(tag => (tag || "").toLowerCase().includes(term))
          : false;
      const matchGenre = selectedGenre ? beat.genre === selectedGenre : true;
      const textSearch = term ? (matchTitle || matchProducer || matchTags) : true;

      if (activeTab === "beats") return textSearch && matchGenre;
      if (activeTab === "producers") return matchProducer;
      return textSearch && matchGenre;
    });

    setSearchResults(filteredResults);
  }, [searchTerm, selectedGenre, beats, activeTab]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (searchTerm || selectedGenre) {
      const event = new Event('input', { bubbles: true });
      document.getElementById('search-input')?.dispatchEvent(event);
    }
  };

  const filteredProducers = producers.filter(producer => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase().trim();
    const matchName = (producer.stage_name || producer.full_name || '').toLowerCase().includes(term);
    const matchCountry = (producer.country || '').toLowerCase().includes(term);
    
    return matchName || matchCountry;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (searchTerm.trim()) {
      params.set('q', searchTerm.trim());
    }
    if (selectedGenre) {
      params.set('genre', selectedGenre);
    }
    setSearchParams(params);
  };

  const handleGenreSelect = (genre: string) => {
    if (selectedGenre === genre) {
      setSelectedGenre('');
    } else {
      setSelectedGenre(genre);
    }
  };

  return (
    <MainLayoutWithPlayer>
      <div className={cn(
        "container py-4 sm:py-6",
        isMobile ? "px-3 sm:px-6" : ""
      )}>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Search</h1>
        
        <div className="relative mb-4 sm:mb-6">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              id="search-input"
              type="text"
              placeholder="Search beats, producers, genres..."
              className="pl-10 pr-12 py-5 h-10 sm:h-12 bg-background border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                className="absolute right-2 rounded-full"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </form>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
            <TabsList className="tabs-mobile w-full sm:w-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="beats">Beats</TabsTrigger>
              <TabsTrigger value="producers">Producers</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 w-full sm:w-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filter</span>
            </Button>
          </div>
          
          {/* Genre filters */}
          <div className="mb-4 overflow-x-auto pb-2">
            <div className="flex gap-2 flex-nowrap">
              {genres.map((genre) => (
                <Button
                  key={genre}
                  variant={selectedGenre === genre ? "default" : "outline"}
                  size="sm"
                  className="rounded-full whitespace-nowrap"
                  onClick={() => handleGenreSelect(genre)}
                >
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          
          {showFilters && (
            <div className="bg-card rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 animate-slide-down shadow-sm border">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-medium mb-1 block">Price Range</label>
                  <select className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm">
                    <option>Any price</option>
                    <option>Under ₦5,000</option>
                    <option>₦5,000 - ₦10,000</option>
                    <option>₦10,000 - ₦15,000</option>
                    <option>Over ₦15,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Genre</label>
                  <select 
                    className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm"
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                  >
                    <option value="">All genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Sort By</label>
                  <select className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm">
                    <option>Most Popular</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">BPM Range</label>
                  <select className="w-full rounded-md bg-muted border-border p-2 text-xs sm:text-sm">
                    <option>Any BPM</option>
                    <option>80-90 BPM</option>
                    <option>90-100 BPM</option>
                    <option>100-120 BPM</option>
                    <option>120+ BPM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-3 sm:mt-4">
                <Button 
                  size="sm" 
                  className="shadow-sm text-xs sm:text-sm"
                  onClick={handleSearch}
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
                {searchResults.map((beat) => (
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
              <div className="text-center py-8 sm:py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-muted mb-3 sm:mb-4">
                  <Search size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-1 sm:mb-2">No results found</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
                  We couldn't find anything matching "{searchTerm}". Try different keywords.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="beats" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {searchResults.map((beat) => (
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <MusicIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No beats found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any beats matching "{searchTerm}".
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="producers" className="mt-0">
            {loadingProducers ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg h-48 animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : filteredProducers.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducers.map((producer) => (
                  <Link 
                    key={producer.id}
                    to={`/producer/${producer.id}`}
                    className="bg-card rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-3">
                      <img 
                        src={producer.profile_picture || '/placeholder.svg'} 
                        alt={producer.stage_name || producer.full_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium">{producer.stage_name || producer.full_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Producer</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{producer.country || 'Unknown location'}</p>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <UserIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No producers found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find any producers matching "{searchTerm}".
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {!searchTerm && !selectedGenre && (
          <div className="mt-6 sm:mt-8">
            <h2 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Chill', 'Dancehall'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs"
                  onClick={() => setSearchTerm(term)}
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
