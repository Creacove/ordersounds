
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { PlusCircle, Music, Heart, ListMusic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate, useLocation } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserPlaylists, createPlaylist } from "@/lib/playlistService";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { Playlist } from "@/types";

export default function Library() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getUserFavoriteBeats, getUserPurchasedBeats, toggleFavorite, isLoading } = useBeats();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);

  const favoriteBeats = getUserFavoriteBeats();
  const purchasedBeats = getUserPurchasedBeats();
  
  // Get tab from URL path
  const getDefaultTab = () => {
    if (location.pathname === "/favorites") return "favorites";
    if (location.pathname === "/purchased") return "purchased";
    if (location.pathname === "/my-playlists") return "playlists";
    return "purchased";
  };
  
  const [activeTab, setActiveTab] = useState(getDefaultTab());
  
  useEffect(() => {
    // Update the tab when the URL changes
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

  const handleCreatePlaylist = async () => {
    if (!user) return;
    
    if (newPlaylistName.trim()) {
      const playlist = await createPlaylist(user.id, newPlaylistName);
      if (playlist) {
        setPlaylists([...playlists, playlist]);
        setNewPlaylistName("");
        setIsCreatingPlaylist(false);
      }
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL to match the tab
    if (value === "favorites") navigate("/favorites");
    else if (value === "purchased") navigate("/purchased");
    else if (value === "playlists") navigate("/my-playlists");
  };
  
  const handleViewPlaylist = (playlistId: string) => {
    navigate(`/playlists?id=${playlistId}`);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Sign in to access your library</h1>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to view your purchased beats, favorites, and playlists.
          </p>
          <Button asChild>
            <a href="/login">Sign In</a>
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
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
              <div className="text-center p-12 bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No purchased beats yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your purchased beats will appear here after you complete a purchase.
                </p>
                <Button asChild>
                  <a href="/">Browse the marketplace</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {purchasedBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    isPurchased={true}
                    onToggleFavorite={toggleFavorite}
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
              <div className="text-center p-12 bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No favorite beats yet</h3>
                <p className="text-muted-foreground mb-4">
                  Favorite beats you like and they will appear here for easy access.
                </p>
                <Button asChild>
                  <a href="/">Start exploring</a>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {favoriteBeats.map((beat) => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    onToggleFavorite={toggleFavorite}
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
              <div className="mb-6 p-4 bg-card rounded-lg animate-slide-down">
                <h3 className="text-sm font-medium mb-2">Create new playlist</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="flex-grow"
                  />
                  <Button onClick={handleCreatePlaylist}>Create</Button>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsCreatingPlaylist(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
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
              <div className="text-center p-12 bg-card rounded-lg">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <ListMusic className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No playlists yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create playlists to organize your favorite beats.
                </p>
                <Button onClick={() => setIsCreatingPlaylist(true)}>
                  Create your first playlist
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((playlist) => (
                  <div 
                    key={playlist.id} 
                    className="bg-card rounded-lg p-4 hover:bg-card/80 transition-colors cursor-pointer"
                    onClick={() => handleViewPlaylist(playlist.id)}
                  >
                    <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
                      <ListMusic className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.beats?.length || 0} {(playlist.beats?.length || 0) === 1 ? 'beat' : 'beats'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <PersistentPlayer />
    </MainLayout>
  );
}
