
import { useState, useEffect, useCallback } from 'react';
import { Playlist } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchPlaylists = useCallback(async () => {
    if (!user) {
      setPlaylists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('owner_id', user.id);

      if (error) {
        throw error;
      }

      if (data) {
        // Transform the data to match the Playlist type expected by the application
        const transformedPlaylists: Playlist[] = data.map(item => ({
          id: item.id,
          name: item.name,
          owner_id: item.owner_id,
          cover_image: item.cover_image,
          is_public: item.is_public,
          beats: item.beats || [],
          created_at: item.created_date, // Map created_date to created_at
          updated_at: item.updated_at
        }));
        
        setPlaylists(transformedPlaylists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user, fetchPlaylists]);

  const createPlaylist = async (name: string) => {
    if (!user) {
      toast.error('You must be logged in to create playlists');
      return;
    }

    try {
      const newPlaylist: Playlist = {
        id: uuidv4(),
        name,
        owner_id: user.id,
        is_public: false,
        beats: [],
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('playlists')
        .insert({
          id: newPlaylist.id,
          name: newPlaylist.name,
          owner_id: newPlaylist.owner_id,
          is_public: newPlaylist.is_public,
          beats: newPlaylist.beats,
          created_date: newPlaylist.created_at // Use created_date for the database
        });

      if (error) {
        throw error;
      }

      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast.error('Failed to create playlist');
      throw error;
    }
  };

  const addBeatToPlaylist = async (playlistId: string, beatId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        toast.error('Playlist not found');
        return;
      }

      const updatedBeats = [...(playlist.beats || []), beatId];
      
      const { error } = await supabase
        .from('playlists')
        .update({ beats: updatedBeats })
        .eq('id', playlistId);

      if (error) {
        throw error;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, beats: updatedBeats } 
            : p
        )
      );
      
      toast.success('Added to playlist');
    } catch (error) {
      console.error('Error adding beat to playlist:', error);
      toast.error('Failed to add to playlist');
    }
  };

  const removeBeatFromPlaylist = async (playlistId: string, beatId: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) {
        toast.error('Playlist not found');
        return;
      }

      const updatedBeats = playlist.beats.filter(id => id !== beatId);
      
      const { error } = await supabase
        .from('playlists')
        .update({ beats: updatedBeats })
        .eq('id', playlistId);

      if (error) {
        throw error;
      }

      setPlaylists(prev => 
        prev.map(p => 
          p.id === playlistId 
            ? { ...p, beats: updatedBeats } 
            : p
        )
      );
      
      toast.success('Removed from playlist');
    } catch (error) {
      console.error('Error removing beat from playlist:', error);
      toast.error('Failed to remove from playlist');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) {
        throw error;
      }

      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast.success('Playlist deleted');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  const getPlaylistById = (playlistId: string) => {
    return playlists.find(p => p.id === playlistId) || null;
  };

  return {
    playlists,
    isLoading,
    fetchPlaylists,
    createPlaylist,
    addBeatToPlaylist,
    removeBeatFromPlaylist,
    deletePlaylist,
    getPlaylistById
  };
}
