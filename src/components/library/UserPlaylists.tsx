
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
import { useIsMobile } from '@/hooks/use-mobile';

export function UserPlaylists() {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      // Use typed RPC call to avoid UUID type issues
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .filter('owner_id', 'eq', user.id)
        .order('created_date', { ascending: false });
        
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
      const newPlaylist = {
        name: playlistData.name,
        owner_id: user.id,
        is_public: playlistData.isPublic,
        cover_image: playlistData.coverImage || null,
        beats: []
      };
      
      const { data, error } = await supabase
        .from('playlists')
        .insert([newPlaylist])
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
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold">Your Playlists</h2>
        <div className="flex gap-2 w-full xs:w-auto">
          <Button 
            variant="outline" 
            size={isMobile ? "sm" : "default"} 
            onClick={refreshPlaylists}
            disabled={isRefreshing}
            className="flex-1 xs:flex-none"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                <span className="whitespace-nowrap">Refreshing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">Refresh</span>
              </>
            )}
          </Button>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size={isMobile ? "sm" : "default"} className="flex-1 xs:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                <span className="whitespace-nowrap">New Playlist</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
          actionOnClick={() => setDialogOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
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
