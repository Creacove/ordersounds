
import { useState, useEffect, useCallback } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem"; 
import { useBeats } from "@/hooks/useBeats";
import { PlusCircle, Music, Heart, ListMusic, Grid, List, Play, Pause } from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserPlaylists, createPlaylist, getPlaylistWithBeats } from "@/lib/playlistService";
import { Playlist, Beat } from "@/types";
import { EmptyState } from "@/components/library/EmptyState";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { CreatePlaylistForm } from "@/components/library/CreatePlaylistForm";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/context/PlayerContext";

export default function Library() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserFavoriteBeats, getUserPurchasedBeats, toggleFavorite, isLoading } = useBeats();
  const { isInCart } = useCart();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(isMobile ? 'list' : 'grid');
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistBeats, setPlaylistBeats] = useState<Beat[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  
  // Check if we're accessing the library from a playlist route
  const params = useParams<{ playlistId?: string }>();
  const playlistId = params.playlistId || new URLSearchParams(location.search).get('id');

  const favoriteBeats = getUserFavoriteBeats();
  const purchasedBeats = getUserPurchasedBeats();
  
  const getDefaultTab = () => {
    if (location.pathname === "/favorites") return "favorites";
    if (location.pathname === "/purchased") return "purchased";
    if (location.pathname.includes("/my-playlists") || playlistId) return "playlists";
    return "purchased";
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);
  
  useEffect(() => {
    loadPlaylists();
    
    document.title = `My Library | OrderSOUNDS`;
    
    const handleResize = () => {
      setViewMode(window.innerWidth < 768 ? 'list' : 'grid');
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

  useEffect(() => {
    if (playlistId && playlists.length > 0) {
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        handleViewPlaylist(playlist);
      }
    }
  }, [playlistId, playlists]);

  useEffect(() => {
    setViewMode(isMobile ? 'list' : 'grid');
  }, [isMobile]);

  const loadPlaylists = async () => {
    if (!user) {
      setLoadingPlaylists(false);
      return;
    }
    
    setLoadingPlaylists(true);
    const userPlaylists = await getUserPlaylists(user.id);
    setPlaylists(userPlaylists);
    setLoadingPlaylists(false);
  };

  const handleToggleFavorite = useCallback((id: string) => {
    toggleFavorite(id);
    return favoriteBeats.some(beat => beat.id === id);
  }, [toggleFavorite, favoriteBeats]);

  const handleCreatePlaylist = async (playlistName: string) => {
    if (!user) return;
    
    const playlist = await createPlaylist(user.id, playlistName);
    if (playlist) {
      setPlaylists([...playlists, playlist]);
      setIsCreatingPlaylist(false);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "favorites") navigate("/favorites");
    else if (value === "purchased") navigate("/purchased");
    else if (value === "playlists") navigate("/my-playlists");
    
    // Clear selected playlist when changing tabs
    setSelectedPlaylist(null);
  };
  
  const handleViewPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    setPlaylistLoading(true);
    
    const { beats } = await getPlaylistWithBeats(playlist.id);
    setPlaylistBeats(beats);
    setPlaylistLoading(false);
    
    // Update URL without full navigation
    navigate(`/my-playlists/${playlist.id}`, { replace: true });
  };
  
  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null);
    navigate("/my-playlists", { replace: true });
  };
  
  const handlePlayAll = () => {
    if (playlistBeats.length === 0) return;
    playBeat(playlistBeats[0]);
  };
  
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const isCurrentlyPlaying = (beatId: string) => {
    return isPlaying && currentBeat?.id === beatId;
  };

  if (!user) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to access your library</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your purchased beats, favorites, and playlists.
          </p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  const renderBeats = (beats, isFavoriteSection = false) => {
    if (isLoading) {
      return (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          : "space-y-3"
        }>
          {[...Array(4)].map((_, i) => (
            viewMode === 'grid' ? (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-md flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            )
          ))}
        </div>
      );
    }
    
    if (beats.length === 0) {
      return null; // Will be handled by the component caller
    }
    
    return viewMode === 'grid' ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {beats.map((beat) => (
          <BeatCard 
            key={beat.id} 
            beat={beat} 
            isPurchased={purchasedBeats.some(b => b.id === beat.id)}
            isInCart={isInCart(beat.id)}
            onToggleFavorite={handleToggleFavorite}
            isFavorite={isFavoriteSection || favoriteBeats.some(b => b.id === beat.id)}
          />
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {beats.map((beat) => (
          <BeatListItem 
            key={beat.id} 
            beat={beat} 
            isFavorite={isFavoriteSection || favoriteBeats.some(b => b.id === beat.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>
    );
  };
  
  // Render the selected playlist content
  if (selectedPlaylist && activeTab === "playlists") {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-6 pb-24 md:py-8 px-4 sm:px-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-4"
            onClick={handleBackToPlaylists}
          >
            ← Back to playlists
          </Button>
          
          <div className="flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/3 lg:w-1/4">
              <div className="aspect-square bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg overflow-hidden shadow-lg">
                {playlistBeats.length > 0 ? (
                  <div className="grid grid-cols-2 h-full w-full">
                    {playlistBeats.slice(0, 4).map((beat, idx) => (
                      <div key={idx} className="relative h-full w-full overflow-hidden">
                        <img 
                          src={beat.cover_image_url || '/placeholder.svg'} 
                          alt={beat.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                      </div>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - playlistBeats.length) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="bg-black/20 h-full w-full"></div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ListMusic size={64} className="text-white/80" />
                  </div>
                )}
              </div>
              
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {!selectedPlaylist.is_public && (
                      <div className="text-muted-foreground flex items-center gap-1">
                        <span className="sr-only">Private</span>
                        <span>Private playlist</span>
                      </div>
                    )}
                    {selectedPlaylist.is_public && (
                      <div className="text-muted-foreground flex items-center gap-1">
                        <span className="sr-only">Public</span>
                        <span>Public playlist</span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {playlistBeats.length} {playlistBeats.length === 1 ? 'track' : 'tracks'}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold truncate">{selectedPlaylist.name}</h1>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button 
                    className="w-full gap-2"
                    onClick={handlePlayAll}
                    disabled={playlistBeats.length === 0}
                  >
                    <Play size={16} />
                    <span>Play All</span>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 bg-muted/30 flex justify-between items-center border-b border-border">
                  <h2 className="font-semibold">Tracks</h2>
                </div>
                
                {playlistLoading ? (
                  <div className="p-8">
                    <div className="flex justify-center">
                      <Skeleton className="h-24 w-full max-w-md" />
                    </div>
                  </div>
                ) : playlistBeats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                      <Music size={20} className="text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No beats in this playlist yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Add beats to this playlist while browsing the marketplace.
                    </p>
                    <Button asChild>
                      <a href="/">Browse Beats</a>
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] px-4 py-2 text-sm text-muted-foreground bg-muted/50">
                      <div className="w-8 text-center">#</div>
                      <div className="pl-14">Title</div>
                      <div className="hidden md:block text-right pr-8">Duration</div>
                      <div className="w-8"></div>
                    </div>
                    
                    {playlistBeats.map((beat, i) => (
                      <div 
                        key={beat.id}
                        className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] px-4 py-3 hover:bg-muted/10 items-center"
                      >
                        <div className="w-8 text-center text-muted-foreground text-sm">
                          {i + 1}
                        </div>
                        
                        <div className="flex items-center min-w-0">
                          <div className="w-10 h-10 rounded overflow-hidden mr-4 flex-shrink-0">
                            <img 
                              src={beat.cover_image_url || '/placeholder.svg'} 
                              alt={beat.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{beat.title}</p>
                            <p className="text-sm text-muted-foreground truncate">
                              {beat.producer_name}
                            </p>
                          </div>
                        </div>
                        
                        <div className="hidden md:block text-sm text-muted-foreground text-right pr-8">
                          {beat.duration || "3:24"}
                        </div>
                        
                        <div className="">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => playBeat(beat)}
                          >
                            {isCurrentlyPlaying(beat.id) ? <Pause size={16} /> : <Play size={16} />}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="container py-6 pb-24 md:py-8 px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold">My Library</h1>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={toggleViewMode}
            className={cn("items-center gap-2", isMobile ? "hidden" : "flex")}
          >
            {viewMode === 'grid' ? (
              <>
                <List size={16} />
                <span className="hidden sm:inline">List View</span>
              </>
            ) : (
              <>
                <Grid size={16} />
                <span className="hidden sm:inline">Grid View</span>
              </>
            )}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue={activeTab} className="w-full">
          <TabsList className="mb-4 md:mb-6 w-full overflow-x-auto flex flex-nowrap justify-start md:justify-center py-1 px-0 bg-transparent border-b rounded-none">
            <TabsTrigger value="purchased" className="flex-shrink-0 gap-2 text-xs md:text-sm">
              <Music size={16} />
              <span>Purchased</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex-shrink-0 gap-2 text-xs md:text-sm">
              <Heart size={16} />
              <span>Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="flex-shrink-0 gap-2 text-xs md:text-sm">
              <ListMusic size={16} />
              <span>My Playlists</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchased" className="animate-fade-in">
            {purchasedBeats.length === 0 ? (
              <EmptyState
                icon={Music}
                title="No purchased beats yet"
                description="Your purchased beats will appear here after you complete a purchase."
                actionLabel="Browse the marketplace"
                actionHref="/"
              />
            ) : renderBeats(purchasedBeats)}
          </TabsContent>

          <TabsContent value="favorites" className="animate-fade-in">
            {favoriteBeats.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorite beats yet"
                description="Favorite beats you like and they will appear here for easy access."
                actionLabel="Start exploring"
                actionHref="/"
              />
            ) : renderBeats(favoriteBeats, true)}
          </TabsContent>

          <TabsContent value="playlists" className="animate-fade-in">
            <div className="mb-4 md:mb-6 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-medium">Your playlists</h2>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => setIsCreatingPlaylist(true)}
              >
                <PlusCircle size={16} />
                <span className="hidden xs:inline">New Playlist</span>
              </Button>
            </div>

            {isCreatingPlaylist && (
              <CreatePlaylistForm
                onSubmit={handleCreatePlaylist}
                onCancel={() => setIsCreatingPlaylist(false)}
              />
            )}

            {loadingPlaylists ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <EmptyState
                icon={ListMusic}
                title="No playlists yet"
                description="Create playlists to organize your favorite beats."
                actionLabel="Create your first playlist"
                onAction={() => setIsCreatingPlaylist(true)}
              />
            ) : (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={(id) => {
                      const playlist = playlists.find(p => p.id === id);
                      if (playlist) handleViewPlaylist(playlist);
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutWithPlayer>
  );
}
