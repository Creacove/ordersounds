
import { useState, useEffect, useCallback } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { PlusCircle, Music, Heart, ListMusic } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserPlaylists, createPlaylist } from "@/lib/playlistService";
import { Playlist } from "@/types";
import { EmptyState } from "@/components/library/EmptyState";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { CreatePlaylistForm } from "@/components/library/CreatePlaylistForm";

export default function Library() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserFavoriteBeats, getUserPurchasedBeats, toggleFavorite, isLoading } = useBeats();
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const favoriteBeats = getUserFavoriteBeats();
  const purchasedBeats = getUserPurchasedBeats();
  
  const getDefaultTab = () => {
    if (location.pathname === "/favorites") return "favorites";
    if (location.pathname === "/purchased") return "purchased";
    if (location.pathname === "/my-playlists") return "playlists";
    return "purchased";
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  useEffect(() => {
    setActiveTab(getDefaultTab());
  }, [location.pathname]);
  
  useEffect(() => {
    loadPlaylists();
    
    document.title = `My Library | Creacove`;
  }, [user]);

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

  // Wrap toggleFavorite to handle the Promise
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
  };
  
  const handleViewPlaylist = (playlistId: string) => {
    navigate(`/playlists?id=${playlistId}`);
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

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Library</h1>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} defaultValue={activeTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="purchased" className="gap-2">
              <Music size={16} />
              <span>Purchased</span>
            </TabsTrigger>
            <TabsTrigger value="favorites" className="gap-2">
              <Heart size={16} />
              <span>Favorites</span>
            </TabsTrigger>
            <TabsTrigger value="playlists" className="gap-2">
              <ListMusic size={16} />
              <span>My Playlists</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchased" className="animate-fade-in">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : purchasedBeats.length === 0 ? (
              <EmptyState
                icon={Music}
                title="No purchased beats yet"
                description="Your purchased beats will appear here after you complete a purchase."
                actionLabel="Browse the marketplace"
                actionHref="/"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {purchasedBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    isPurchased={true}
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={favoriteBeats.some(b => b.id === beat.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="animate-fade-in">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : favoriteBeats.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No favorite beats yet"
                description="Favorite beats you like and they will appear here for easy access."
                actionLabel="Start exploring"
                actionHref="/"
              />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {favoriteBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    onToggleFavorite={handleToggleFavorite}
                    isFavorite={true}
                    isPurchased={purchasedBeats.some(b => b.id === beat.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="playlists" className="animate-fade-in">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-medium">Your playlists</h2>
              <Button 
                size="sm" 
                className="gap-2"
                onClick={() => setIsCreatingPlaylist(true)}
              >
                <PlusCircle size={16} />
                <span>New Playlist</span>
              </Button>
            </div>

            {isCreatingPlaylist && (
              <CreatePlaylistForm
                onSubmit={handleCreatePlaylist}
                onCancel={() => setIsCreatingPlaylist(false)}
              />
            )}

            {loadingPlaylists ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onClick={handleViewPlaylist}
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
