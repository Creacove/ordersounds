
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from './storage';
import { Beat, RoyaltySplit } from '@/types';
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
    license_type?: string;
    license_terms?: string;
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
        plays: 0,
        license_type: beatInfo.license_type,
        license_terms: beatInfo.license_terms
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
        party_email: collaborator.email,
        party_name: collaborator.name,
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

/**
 * Gets all royalty splits for a producer
 */
export const getProducerRoyaltySplits = async (producerId: string): Promise<RoyaltySplit[]> => {
  try {
    // First get all beats where the producer is the owner
    const { data: producerBeats, error: beatsError } = await supabase
      .from('beats')
      .select('id, title, cover_image')
      .eq('producer_id', producerId);
    
    if (beatsError) {
      throw beatsError;
    }

    if (!producerBeats || producerBeats.length === 0) {
      return [];
    }

    // Get beat IDs
    const beatIds = producerBeats.map(beat => beat.id);

    // Get royalty splits for all these beats
    const { data: royaltySplits, error: royaltyError } = await supabase
      .from('royalty_splits')
      .select('*')
      .in('beat_id', beatIds);
    
    if (royaltyError) {
      throw royaltyError;
    }

    if (!royaltySplits) {
      return [];
    }

    // Create a map of beat details for easy lookup
    const beatDetailsMap = producerBeats.reduce((map, beat) => {
      map[beat.id] = {
        title: beat.title,
        cover_image: beat.cover_image
      };
      return map;
    }, {});

    // Transform the data to match the RoyaltySplit type
    return royaltySplits.map(split => ({
      id: split.id,
      beat_id: split.beat_id,
      beat_title: beatDetailsMap[split.beat_id]?.title || 'Unknown Beat',
      beat_cover_image: beatDetailsMap[split.beat_id]?.cover_image || null,
      collaborator_id: split.party_id || '',
      collaborator_name: split.party_name || 'Unknown',
      collaborator_email: split.party_email || '',
      collaborator_role: split.party_role || '',
      percentage: split.percentage || 0,
      created_at: split.created_date || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error fetching royalty splits:', error);
    toast.error('Failed to load royalty splits');
    return [];
  }
};
