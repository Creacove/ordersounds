
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Music2, ListMusic, Edit2, Trash2, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/context/PlayerContext";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getUserPlaylists, createPlaylist, getPlaylistWithBeats, deletePlaylist, updatePlaylist } from "@/lib/playlistService";
import { useBeats } from "@/hooks/useBeats";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { Playlist, Beat } from "@/types";

export default function Playlists() {
  const { user } = useAuth();
  const { playBeat } = usePlayer();
  const { beats } = useBeats();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistBeats, setPlaylistBeats] = useState<Beat[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [editPlaylistName, setEditPlaylistName] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  useEffect(() => {
    document.title = "Playlists | Creacove";
    loadPlaylists();
  }, [user]);

  const loadPlaylists = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const userPlaylists = await getUserPlaylists(user.id);
    setPlaylists(userPlaylists);
    setIsLoading(false);
  };

  const handleCreatePlaylist = async () => {
    if (!user) {
      toast.error("Please log in to create playlists");
      return;
    }
    
    if (!newPlaylistName.trim()) {
      toast.error("Please enter a playlist name");
      return;
    }
    
    const playlist = await createPlaylist(user.id, newPlaylistName, isPublic);
    if (playlist) {
      setPlaylists([...playlists, playlist]);
      setNewPlaylistName("");
      setIsPublic(true);
      setIsCreateDialogOpen(false);
    }
  };

  const handleSelectPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    
    const { beats } = await getPlaylistWithBeats(playlist.id);
    setPlaylistBeats(beats);
  };

  const handlePlayAll = () => {
    if (playlistBeats.length === 0) return;
    
    // Play the first beat and add the rest to queue
    playBeat(playlistBeats[0]);
  };

  const handleDeletePlaylist = async (id: string) => {
    const success = await deletePlaylist(id);
    if (success) {
      setPlaylists(playlists.filter(p => p.id !== id));
      
      // If the deleted playlist was the selected one, clear selection
      if (selectedPlaylist && selectedPlaylist.id === id) {
        setSelectedPlaylist(null);
        setPlaylistBeats([]);
      }
    }
  };

  const handleEditPlaylist = (playlist: Playlist) => {
    setEditPlaylistName(playlist.name);
    setEditIsPublic(playlist.is_public);
    setSelectedPlaylist(playlist);
    setIsEditDialogOpen(true);
  };

  const savePlaylistChanges = async () => {
    if (!selectedPlaylist) return;
    
    const updates = {
      name: editPlaylistName,
      is_public: editIsPublic
    };
    
    const success = await updatePlaylist(selectedPlaylist.id, updates);
    if (success) {
      // Update playlists state
      setPlaylists(playlists.map(p => 
        p.id === selectedPlaylist.id
          ? { ...p, ...updates }
          : p
      ));
      
      // Update selected playlist if needed
      if (selectedPlaylist) {
        setSelectedPlaylist({
          ...selectedPlaylist,
          ...updates
        });
      }
      
      setIsEditDialogOpen(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Playlists</h1>
          
          {user && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusCircle size={16} />
                  <span>Create Playlist</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Playlist</DialogTitle>
                  <DialogDescription>
                    Give your playlist a name and choose its visibility.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="playlist-name">Playlist Name</Label>
                    <Input
                      id="playlist-name"
                      placeholder="My Awesome Playlist"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="playlist-public"
                      checked={isPublic}
                      onCheckedChange={setIsPublic}
                    />
                    <Label htmlFor="playlist-public">Make this playlist public</Label>
                  </div>
                </div>
                
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreatePlaylist}>Create Playlist</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Playlists Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-card rounded-lg p-4 border border-border">
              <h2 className="font-semibold mb-3">Your Playlists</h2>
              
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-10 w-10 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !user ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-2">Sign in to create and manage your playlists</p>
                  <Button asChild variant="outline" size="sm">
                    <a href="/login">Sign In</a>
                  </Button>
                </div>
              ) : playlists.length === 0 ? (
                <div className="text-center p-4">
                  <p className="text-muted-foreground mb-2">No playlists yet</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <PlusCircle size={14} />
                    <span>Create Your First Playlist</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {playlists.map((playlist) => (
                    <div 
                      key={playlist.id}
                      className={`flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedPlaylist?.id === playlist.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => handleSelectPlaylist(playlist)}
                    >
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <ListMusic size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{playlist.name}</p>
                        <div className="flex items-center">
                          <span className="text-xs text-muted-foreground">
                            {playlist.beats?.length || 0} beats
                          </span>
                          {!playlist.is_public && (
                            <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">
                              Private
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Playlist Content */}
          <div className="lg:col-span-3">
            {selectedPlaylist ? (
              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold">{selectedPlaylist.name}</h2>
                      {!selectedPlaylist.is_public && (
                        <Badge variant="outline">Private</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {playlistBeats.length} {playlistBeats.length === 1 ? 'beat' : 'beats'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="gap-1"
                      onClick={() => handlePlayAll()}
                      disabled={playlistBeats.length === 0}
                    >
                      <Play size={16} />
                      <span>Play All</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditPlaylist(selectedPlaylist)}
                    >
                      <Edit2 size={16} />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{selectedPlaylist.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePlaylist(selectedPlaylist.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                {playlistBeats.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-4">
                      <Music2 className="text-muted-foreground h-6 w-6" />
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
                    {playlistBeats.map((beat, i) => (
                      <div 
                        key={beat.id}
                        className="flex items-center py-3 hover:bg-muted/10 -mx-4 px-4"
                      >
                        <div className="w-8 text-center text-muted-foreground text-sm">
                          {i + 1}
                        </div>
                        <div className="w-12 h-12 rounded overflow-hidden mx-4">
                          <img 
                            src={beat.cover_image_url} 
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
                        <div className="ml-4">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => playBeat(beat)}
                          >
                            <Play size={18} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-card rounded-lg p-12 border border-border text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                  <ListMusic className="text-muted-foreground h-8 w-8" />
                </div>
                <h2 className="text-xl font-medium mb-2">No playlist selected</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Select a playlist from the sidebar or create a new one to get started.
                </p>
                {user && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    Create New Playlist
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edit Playlist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Playlist</DialogTitle>
            <DialogDescription>
              Update your playlist details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-playlist-name">Playlist Name</Label>
              <Input
                id="edit-playlist-name"
                value={editPlaylistName}
                onChange={(e) => setEditPlaylistName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-playlist-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
              <Label htmlFor="edit-playlist-public">Make this playlist public</Label>
            </div>
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={savePlaylistChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <PersistentPlayer />
    </MainLayout>
  );
}
