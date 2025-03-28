
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { RefreshCw, ListMusic, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { CreatePlaylistForm } from './CreatePlaylistForm';
import { PlaylistCard } from './PlaylistCard';
import { useNavigate } from 'react-router-dom';

export function UserPlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [user]);

  const refreshPlaylists = async () => {
    setIsRefreshing(true);
    try {
      await fetchPlaylists();
      toast.success('Your playlists have been refreshed');
    } catch (error) {
      console.error('Error refreshing playlists:', error);
      toast.error('Failed to refresh your playlists');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreatePlaylist = async (playlistData) => {
    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          name: playlistData.name,
          owner_id: user.id,
          is_public: playlistData.isPublic,
          cover_image: playlistData.coverImage || null,
          beats: []
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setPlaylists([data, ...playlists]);
      setDialogOpen(false);
      toast.success('Playlist created successfully');
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  const handlePlaylistClick = (playlistId) => {
    navigate(`/my-playlists/${playlistId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">My Playlists</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Playlists</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshPlaylists}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </>
            )}
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreatePlaylistForm onSubmit={handleCreatePlaylist} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {playlists.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="No playlists yet"
          description="Create playlists to organize your favorite beats"
          actionLabel="Create Playlist"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {playlists.map((playlist) => (
            <PlaylistCard 
              key={playlist.id} 
              playlist={playlist} 
              onClick={handlePlaylistClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
