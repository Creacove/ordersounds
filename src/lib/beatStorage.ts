
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from './storage';
import { Beat } from '@/types';
import { toast } from 'sonner';

/**
 * Uploads a beat with all its associated files and metadata to Supabase
 */
export const uploadBeat = async (
  beatInfo: {
    title: string;
    description: string;
    genre: string;
    track_type: string;
    bpm: number;
    tags: string[];
    price_local: number;
    price_diaspora: number;
    status: 'draft' | 'published';
  },
  fullTrackFile: File,
  previewFile: File,
  coverImageFile: File,
  producerId: string,
  producerName: string,
  collaborators: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    percentage: number;
  }>
): Promise<{success: boolean; beatId?: string; error?: string}> => {
  try {
    // Step 1: Upload all files to storage
    console.log('Uploading files to storage...');
    const uploadPromises = [
      uploadFile(coverImageFile, 'covers', 'beats'),
      uploadFile(previewFile, 'beats', 'previews'),
      uploadFile(fullTrackFile, 'beats', 'full-tracks')
    ];
    
    const [coverImageUrl, previewUrl, fullTrackUrl] = await Promise.all(uploadPromises);
    console.log('Files uploaded successfully:', { coverImageUrl, previewUrl, fullTrackUrl });

    // Step 2: Insert beat record into database
    console.log('Inserting beat record into database...');
    const { data: beatRecord, error: beatError } = await supabase
      .from('beats')
      .insert({
        producer_id: producerId,
        title: beatInfo.title,
        description: beatInfo.description,
        genre: beatInfo.genre,
        track_type: beatInfo.track_type,
        bpm: beatInfo.bpm,
        tags: beatInfo.tags,
        price_local: beatInfo.price_local,
        price_diaspora: beatInfo.price_diaspora,
        status: beatInfo.status,
        cover_image: coverImageUrl,
        audio_preview: previewUrl,
        audio_file: fullTrackUrl,
        favorites_count: 0,
        purchase_count: 0,
        plays: 0
      })
      .select('id')
      .single();

    if (beatError) {
      console.error('Error inserting beat record:', beatError);
      throw new Error(`Error inserting beat: ${beatError.message}`);
    }

    const beatId = beatRecord.id;
    console.log('Beat record inserted successfully:', beatId);

    // Step 3: Insert royalty splits if there are collaborators
    if (collaborators.length > 0) {
      console.log('Inserting royalty splits...');
      const royaltySplits = collaborators.map(collaborator => ({
        beat_id: beatId,
        party_id: collaborator.id === 1 ? producerId : null, // Main producer uses their ID
        party_name: collaborator.name,
        party_email: collaborator.id !== 1 ? collaborator.email : null, // Collaborators use email for now
        party_role: collaborator.role,
        percentage: collaborator.percentage,
      }));

      const { error: royaltyError } = await supabase
        .from('royalty_splits')
        .insert(royaltySplits);

      if (royaltyError) {
        console.error('Error inserting royalty splits:', royaltyError);
        // Don't throw here, we can still consider the beat uploaded
        toast.warning('Beat uploaded, but there was an issue with royalty splits');
      } else {
        console.log('Royalty splits inserted successfully');
      }
    }

    return { success: true, beatId };
  } catch (error) {
    console.error('Beat upload error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during beat upload' 
    };
  }
};

/**
 * Gets all beats produced by a specific user
 */
export const getProducerBeats = async (producerId: string): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(`
        id, 
        title, 
        producer_id,
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
        status,
        users (full_name, stage_name)
      `)
      .eq('producer_id', producerId);

    if (error) {
      throw error;
    }

    // Transform the data to match the Beat type
    return data.map(beat => {
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
  } catch (error) {
    console.error('Error fetching producer beats:', error);
    toast.error('Failed to load beats');
    return [];
  }
};
