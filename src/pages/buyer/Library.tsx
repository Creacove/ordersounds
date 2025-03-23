
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { PlusCircle, Music, Heart, ListMusic } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Library() {
  const { getUserFavoriteBeats, getUserPurchasedBeats, isLoading } = useBeats();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const favoriteBeats = getUserFavoriteBeats();
  const purchasedBeats = getUserPurchasedBeats();

  // Mock playlists for demo
  const [playlists, setPlaylists] = useState([
    { id: '1', name: 'Workout Beats', beatCount: 5 },
    { id: '2', name: 'Studio Session', beatCount: 3 },
  ]);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const newPlaylist = {
        id: `playlist-${Date.now()}`,
        name: newPlaylistName,
        beatCount: 0
      };
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName("");
      setIsCreatingPlaylist(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Library</h1>
        </div>

        <Tabs defaultValue="purchased" className="w-full">
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
            {purchasedBeats.length === 0 ? (
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
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="animate-fade-in">
            {favoriteBeats.length === 0 ? (
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
                  <BeatCard key={beat.id} beat={beat} />
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

            {playlists.length === 0 ? (
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
                  >
                    <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
                      <ListMusic className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {playlist.beatCount} {playlist.beatCount === 1 ? 'beat' : 'beats'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
