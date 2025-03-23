
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Playlist, Beat } from '@/types';

/**
 * Create a new playlist
 */
export const createPlaylist = async (
  userId: string,
  name: string,
  isPublic: boolean = true
): Promise<Playlist | null> => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        owner_id: userId,
        name,
        is_public: isPublic,
        beats: [],
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return data as unknown as Playlist;
  } catch (error) {
    console.error('Error creating playlist:', error);
    toast.error('Failed to create playlist');
    return null;
  }
};

/**
 * Get all playlists for a user
 */
export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('owner_id', userId);
    
    if (error) throw error;
    
    return data as unknown as Playlist[];
  } catch (error) {
    console.error('Error fetching playlists:', error);
    toast.error('Failed to load playlists');
    return [];
  }
};

/**
 * Add a beat to a playlist
 */
export const addBeatToPlaylist = async (playlistId: string, beatId: string): Promise<boolean> => {
  try {
    // First get the current beats array
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('beats')
      .eq('id', playlistId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Check if beat already exists in playlist
    const currentBeats = playlist.beats || [];
    if (currentBeats.includes(beatId)) {
      toast.info('Beat already in playlist');
      return true;
    }
    
    // Add the new beat ID
    const updatedBeats = [...currentBeats, beatId];
    
    // Update the playlist
    const { error: updateError } = await supabase
      .from('playlists')
      .update({ beats: updatedBeats })
      .eq('id', playlistId);
    
    if (updateError) throw updateError;
    
    toast.success('Beat added to playlist');
    return true;
  } catch (error) {
    console.error('Error adding beat to playlist:', error);
    toast.error('Failed to add beat to playlist');
    return false;
  }
};

/**
 * Remove a beat from a playlist
 */
export const removeBeatFromPlaylist = async (playlistId: string, beatId: string): Promise<boolean> => {
  try {
    // First get the current beats array
    const { data: playlist, error: fetchError } = await supabase
      .from('playlists')
      .select('beats')
      .eq('id', playlistId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Filter out the beat ID
    const currentBeats = playlist.beats || [];
    const updatedBeats = currentBeats.filter(id => id !== beatId);
    
    // Update the playlist
    const { error: updateError } = await supabase
      .from('playlists')
      .update({ beats: updatedBeats })
      .eq('id', playlistId);
    
    if (updateError) throw updateError;
    
    toast.success('Beat removed from playlist');
    return true;
  } catch (error) {
    console.error('Error removing beat from playlist:', error);
    toast.error('Failed to remove beat from playlist');
    return false;
  }
};

/**
 * Get a playlist with all its beats
 */
export const getPlaylistWithBeats = async (playlistId: string): Promise<{playlist: Playlist, beats: Beat[]}> => {
  try {
    // Get the playlist first
    const { data: playlist, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('id', playlistId)
      .single();
    
    if (playlistError) throw playlistError;
    
    // If no beats in playlist, return empty array
    if (!playlist.beats || playlist.beats.length === 0) {
      return { 
        playlist: playlist as unknown as Playlist, 
        beats: [] 
      };
    }
    
    // Get all beats in the playlist
    const { data: beats, error: beatsError } = await supabase
      .from('beats')
      .select(`
        id, 
        title, 
        producer_id,
        users (
          full_name,
          stage_name
        ),
        cover_image,
        audio_preview,
        audio_file,
        price_local,
        price_diaspora,
        genre,
        track_type,
        bpm,
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .in('id', playlist.beats);
    
    if (beatsError) throw beatsError;
    
    // Transform beats data to match Beat type
    const transformedBeats: Beat[] = beats.map(beat => {
      const userData = beat.users;
      const producerName = userData && userData.stage_name ? userData.stage_name : 
                          userData && userData.full_name ? userData.full_name : 'Unknown Producer';
      
      return {
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: producerName,
        cover_image_url: beat.cover_image,
        preview_url: beat.audio_preview,
        full_track_url: beat.audio_file,
        price_local: beat.price_local,
        price_diaspora: beat.price_diaspora,
        genre: beat.genre,
        track_type: beat.track_type,
        bpm: beat.bpm,
        tags: beat.tags || [],
        description: beat.description,
        created_at: beat.upload_date,
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        status: beat.status as 'draft' | 'published',
        is_featured: false
      };
    });
    
    return {
      playlist: playlist as unknown as Playlist,
      beats: transformedBeats
    };
  } catch (error) {
    console.error('Error fetching playlist with beats:', error);
    toast.error('Failed to load playlist');
    return { playlist: {} as Playlist, beats: [] };
  }
};

/**
 * Delete a playlist
 */
export const deletePlaylist = async (playlistId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId);
    
    if (error) throw error;
    
    toast.success('Playlist deleted');
    return true;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    toast.error('Failed to delete playlist');
    return false;
  }
};

/**
 * Update playlist details
 */
export const updatePlaylist = async (
  playlistId: string, 
  updates: Partial<Playlist>
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('playlists')
      .update(updates)
      .eq('id', playlistId);
    
    if (error) throw error;
    
    toast.success('Playlist updated');
    return true;
  } catch (error) {
    console.error('Error updating playlist:', error);
    toast.error('Failed to update playlist');
    return false;
  }
};
