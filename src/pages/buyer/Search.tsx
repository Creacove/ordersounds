
import { useState, useEffect } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Search, MusicIcon, UserIcon, ListMusic, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { beats, isLoading } = useBeats();
  const [searchResults, setSearchResults] = useState(beats);

  // Process search results whenever search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(beats);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    // Filter based on search term and active tab
    const filteredResults = beats.filter(beat => {
      const matchTitle = beat.title.toLowerCase().includes(term);
      const matchProducer = beat.producer_name.toLowerCase().includes(term);
      const matchGenre = beat.genre.toLowerCase().includes(term);
      
      if (activeTab === "beats") return matchTitle || matchGenre;
      if (activeTab === "producers") return matchProducer;
      return matchTitle || matchProducer || matchGenre;
    });

    setSearchResults(filteredResults);
  }, [searchTerm, beats, activeTab]);

  // Reset search when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (searchTerm) {
      // Retrigger search with new tab
      const event = new Event('input', { bubbles: true });
      document.getElementById('search-input')?.dispatchEvent(event);
    }
  };

  return (
    <MainLayoutWithPlayer>
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        
        {/* Search input */}
        <div className="relative mb-6">
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
            <Input 
              id="search-input"
              type="text"
              placeholder="Search beats, producers, genres..."
              className="pl-10 pr-4 py-6 h-12 bg-background border-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            {searchTerm && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute right-2 rounded-full"
                onClick={() => setSearchTerm("")}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="beats">Beats</TabsTrigger>
              <TabsTrigger value="producers">Producers</TabsTrigger>
            </TabsList>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filter</span>
            </Button>
          </div>
          
          {/* Filter panel (collapsible) */}
          {showFilters && (
            <div className="bg-card rounded-lg p-4 mb-6 animate-slide-down shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price Range</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>Any price</option>
                    <option>Under ₦5,000</option>
                    <option>₦5,000 - ₦10,000</option>
                    <option>₦10,000 - ₦15,000</option>
                    <option>Over ₦15,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Genre</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>All genres</option>
                    <option>Afrobeat</option>
                    <option>Amapiano</option>
                    <option>Hip Hop</option>
                    <option>R&B</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>Most Popular</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">BPM Range</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>Any BPM</option>
                    <option>80-90 BPM</option>
                    <option>90-100 BPM</option>
                    <option>100-120 BPM</option>
                    <option>120+ BPM</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm" className="shadow-sm">Apply Filters</Button>
              </div>
            </div>
          )}

          <TabsContent value="all" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {searchResults.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <Search size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  We couldn't find anything matching "{searchTerm}". Try different keywords.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="beats" className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg aspect-square animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {searchResults.map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
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
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="bg-card rounded-lg h-48 animate-pulse"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((beat) => (
                  <div 
                    key={beat.id}
                    className="bg-card rounded-lg p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-24 h-24 rounded-full bg-muted overflow-hidden mb-3">
                      <img 
                        src={beat.cover_image_url} 
                        alt={beat.producer_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium">{beat.producer_name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">Producer</p>
                    <Button variant="outline" size="sm" className="w-full">View Profile</Button>
                  </div>
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

        {/* Recent searches (only show when there's no active search) */}
        {!searchTerm && (
          <div className="mt-8">
            <h2 className="text-lg font-medium mb-4">Popular Searches</h2>
            <div className="flex flex-wrap gap-2">
              {['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Chill', 'Dancehall'].map((term) => (
                <Button
                  key={term}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
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
