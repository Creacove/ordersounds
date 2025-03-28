
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from './storage';
import { Beat, RoyaltySplit } from '@/types';
import { toast } from 'sonner';

interface BeatUploadData {
  producer_id: string;
  title: string;
  description: string;
  genre: string;
  track_type: string;
  bpm: number;
  key?: string;
  tags: string[];
  status: 'draft' | 'published';
  cover_image: string;
  audio_preview: string;
  audio_file: string;
  favorites_count: number;
  purchase_count: number;
  plays: number;
  license_terms: string;
  license_type?: string;
  basic_license_price_local?: number;
  basic_license_price_diaspora?: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  custom_license_price_local?: number;
  custom_license_price_diaspora?: number;
}

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
    key?: string;
    tags: string[];
    basic_license_price_local: number;
    basic_license_price_diaspora: number;
    premium_license_price_local: number;
    premium_license_price_diaspora: number;
    exclusive_license_price_local: number;
    exclusive_license_price_diaspora: number;
    status: 'draft' | 'published';
    license_type?: string;
    license_terms?: string;
    custom_license_price_local?: number;
    custom_license_price_diaspora?: number;
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
    console.log('Uploading files to storage...');
    const uploadPromises = [
      uploadFile(coverImageFile, 'covers', 'beats'),
      uploadFile(previewFile, 'beats', 'previews'),
      uploadFile(fullTrackFile, 'beats', 'full-tracks')
    ];
    
    const [coverImageUrl, previewUrl, fullTrackUrl] = await Promise.all(uploadPromises);
    console.log('Files uploaded successfully:', { coverImageUrl, previewUrl, fullTrackUrl });

    console.log('Inserting beat record into database...');
    
    const beatData: BeatUploadData = {
      producer_id: producerId,
      title: beatInfo.title,
      description: beatInfo.description,
      genre: beatInfo.genre,
      track_type: beatInfo.track_type,
      bpm: beatInfo.bpm,
      key: beatInfo.key,
      tags: beatInfo.tags,
      status: beatInfo.status,
      cover_image: coverImageUrl,
      audio_preview: previewUrl,
      audio_file: fullTrackUrl,
      favorites_count: 0,
      purchase_count: 0,
      plays: 0,
      license_terms: beatInfo.license_terms || ''
    };
    
    // Save all specified license prices for each license type selected
    if (beatInfo.license_type) {
      beatData.license_type = beatInfo.license_type;
      
      // Check if each license type is included in the license_type string and save its price
      if (beatInfo.license_type.includes('basic')) {
        beatData.basic_license_price_local = beatInfo.basic_license_price_local;
        beatData.basic_license_price_diaspora = beatInfo.basic_license_price_diaspora;
      }
      
      if (beatInfo.license_type.includes('premium')) {
        beatData.premium_license_price_local = beatInfo.premium_license_price_local;
        beatData.premium_license_price_diaspora = beatInfo.premium_license_price_diaspora;
      }
      
      if (beatInfo.license_type.includes('exclusive')) {
        beatData.exclusive_license_price_local = beatInfo.exclusive_license_price_local;
        beatData.exclusive_license_price_diaspora = beatInfo.exclusive_license_price_diaspora;
      }
      
      if (beatInfo.license_type.includes('custom') && beatInfo.custom_license_price_local && beatInfo.custom_license_price_diaspora) {
        beatData.custom_license_price_local = beatInfo.custom_license_price_local;
        beatData.custom_license_price_diaspora = beatInfo.custom_license_price_diaspora;
      }
    }

    // For debugging - log the data before insert
    console.log('Beat data to be inserted:', beatData);

    const { data: beatRecord, error: beatError } = await supabase
      .from('beats')
      .insert(beatData)
      .select('id')
      .single();

    if (beatError) {
      console.error('Error inserting beat record:', beatError);
      throw new Error(`Error inserting beat: ${beatError.message}`);
    }

    const beatId = beatRecord.id;
    console.log('Beat record inserted successfully:', beatId);

    if (collaborators.length > 0) {
      console.log('Inserting royalty splits...');
      const royaltySplits = collaborators.map(collaborator => ({
        beat_id: beatId,
        party_id: collaborator.id === 1 ? producerId : null,
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
        genre,
        track_type,
        bpm,
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        status,
        basic_license_price_local,
        basic_license_price_diaspora,
        premium_license_price_local,
        premium_license_price_diaspora,
        exclusive_license_price_local,
        exclusive_license_price_diaspora,
        custom_license_price_local,
        custom_license_price_diaspora,
        users (full_name, stage_name)
      `)
      .eq('producer_id', producerId);

    if (error) {
      throw error;
    }

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
        genre: beat.genre,
        track_type: beat.track_type,
        bpm: beat.bpm,
        tags: beat.tags || [],
        description: beat.description,
        created_at: beat.upload_date,
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        status: beat.status as 'draft' | 'published',
        is_featured: false,
        basic_license_price_local: beat.basic_license_price_local || 0,
        basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
        premium_license_price_local: beat.premium_license_price_local || 0,
        premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
        exclusive_license_price_local: beat.exclusive_license_price_local || 0,
        exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
        custom_license_price_local: beat.custom_license_price_local || 0,
        custom_license_price_diaspora: beat.custom_license_price_diaspora || 0
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

    const beatIds = producerBeats.map(beat => beat.id);

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

    const beatDetailsMap = producerBeats.reduce((map, beat) => {
      map[beat.id] = {
        title: beat.title,
        cover_image: beat.cover_image
      };
      return map;
    }, {});

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
