
import { supabase } from '@/integrations/supabase/client';
import { FileOrUrl, isFile, uploadFile } from './storage';
import { uploadImage } from './imageStorage';
import { Beat, RoyaltySplit } from '@/types';
import { toast } from 'sonner';
import { Collaborator } from '@/hooks/useBeatUpload';

interface BeatUploadResult {
  success: boolean;
  beatId?: string;
  error?: string;
}

type UploadBeatData = {
  title: string;
  description?: string;
  genre: string;
  track_type: string;
  bpm: number;
  key: string;
  tags: string[];
  basic_license_price_local?: number;
  basic_license_price_diaspora?: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  custom_license_price_local?: number;
  custom_license_price_diaspora?: number;
  status: 'draft' | 'published';
  license_type: string;
  license_terms?: string;
  cover_image?: string; // Added to accept direct cover image URL or base64
};

/**
 * Retrieves all royalty splits for a specific producer
 * @param producerId The ID of the producer
 * @returns Array of royalty splits
 */
export const getProducerRoyaltySplits = async (producerId: string): Promise<RoyaltySplit[]> => {
  try {
    console.log('Fetching royalty splits for producer:', producerId);
    
    const { data, error } = await supabase
      .from('royalty_splits')
      .select('*')
      .eq('party_id', producerId);
    
    if (error) {
      console.error('Error fetching royalty splits:', error);
      throw error;
    }
    
    if (!data) return [];
    
    // Map database fields to RoyaltySplit interface
    return data.map(item => ({
      id: item.id,
      beat_id: item.beat_id,
      beat_title: item.party_name || '',
      beat_cover_image: null,
      collaborator_id: item.party_id,
      collaborator_name: item.party_name || '',
      collaborator_email: item.party_email || '',
      collaborator_role: item.party_role || '',
      percentage: item.percentage,
      created_at: item.created_date
    }));
  } catch (error) {
    console.error('Error in getProducerRoyaltySplits:', error);
    throw error;
  }
};

export const uploadBeat = async (
  beatData: UploadBeatData,
  fullTrackFileOrUrl: FileOrUrl,
  previewTrackFile: File | null,
  coverImageFile: File | null,
  stemsFile: File | null,
  producerId: string,
  producerName: string,
  collaborators: Collaborator[],
  selectedLicenseTypes: string[],
  previewUrl?: string
): Promise<BeatUploadResult> => {
  try {
    console.log('Starting beat upload process');
    
    // Check if user is authenticated
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error('Authentication required to upload beat', sessionError);
      return {
        success: false,
        error: 'You must be logged in to upload beats'
      };
    }
    
    // Upload full track file if it's a File object
    let fullTrackUrl: string;
    if (isFile(fullTrackFileOrUrl)) {
      console.log('Uploading full track file');
      try {
        fullTrackUrl = await uploadFile(fullTrackFileOrUrl, 'beats', 'full-tracks');
      } catch (error) {
        console.error('Failed to upload full track:', error);
        return {
          success: false,
          error: `Failed to upload full track: ${error.message}`
        };
      }
    } else {
      fullTrackUrl = fullTrackFileOrUrl.url;
    }
    
    // Upload preview track if provided
    let previewTrackUrl: string = previewUrl || '';
    if (previewTrackFile) {
      console.log('Uploading preview track file');
      try {
        previewTrackUrl = await uploadFile(previewTrackFile, 'beats', 'previews');
      } catch (error) {
        console.error('Failed to upload preview track:', error);
        return {
          success: false,
          error: `Failed to upload preview track: ${error.message}`
        };
      }
    }
    
    // Use the provided cover image (could be URL, base64, or null)
    let coverImageUrl: string = beatData.cover_image || '';
    
    // Upload stems if provided
    let stemsUrl: string | null = null;
    if (stemsFile) {
      console.log('Uploading stems file');
      try {
        stemsUrl = await uploadFile(stemsFile, 'beats', 'stems');
      } catch (error) {
        console.error('Failed to upload stems:', error);
        return {
          success: false,
          error: `Failed to upload stems: ${error.message}`
        };
      }
    }
    
    // Prepare beat data for database insert
    const beatInsertData = {
      title: beatData.title,
      description: beatData.description || '',
      genre: beatData.genre,
      track_type: beatData.track_type,
      bpm: beatData.bpm,
      key: beatData.key || 'C Major',
      producer_id: producerId,
      audio_file: fullTrackUrl,
      audio_preview: previewTrackUrl,
      cover_image: coverImageUrl,
      tags: beatData.tags,
      status: beatData.status,
      upload_date: new Date().toISOString(),
      license_type: beatData.license_type,
      license_terms: beatData.license_terms || '',
      basic_license_price_local: beatData.basic_license_price_local || 0,
      basic_license_price_diaspora: beatData.basic_license_price_diaspora || 0,
      premium_license_price_local: beatData.premium_license_price_local || 0,
      premium_license_price_diaspora: beatData.premium_license_price_diaspora || 0,
      exclusive_license_price_local: beatData.exclusive_license_price_local || 0,
      exclusive_license_price_diaspora: beatData.exclusive_license_price_diaspora || 0,
      custom_license_price_local: beatData.custom_license_price_local || 0,
      custom_license_price_diaspora: beatData.custom_license_price_diaspora || 0,
      stems_url: stemsUrl, // Use stems_url instead of stems to match DB schema
    };
    
    console.log('Inserting beat into database');
    const { data: beatData_, error: beatError } = await supabase
      .from('beats')
      .insert([beatInsertData])
      .select()
      .single();
      
    if (beatError) {
      console.error('Error inserting beat:', beatError);
      throw new Error(`Database error: ${beatError.message}`);
    }
    
    if (!beatData_) {
      throw new Error('No data returned from beat insert');
    }
    
    const beatId = beatData_.id;
    console.log('Beat inserted with ID:', beatId);
    
    // Insert collaborator data
    if (collaborators && collaborators.length > 0) {
      console.log('Inserting collaborator data');
      
      const collaboratorInserts = collaborators.map(c => ({
        beat_id: beatId,
        party_id: c.id.toString().includes('-') ? c.id.toString() : producerId,
        party_name: c.name || producerName,
        party_email: c.email || '',
        party_role: c.role || 'Producer',
        percentage: c.percentage
      }));
      
      const { error: collabError } = await supabase
        .from('royalty_splits')
        .insert(collaboratorInserts);
        
      if (collabError) {
        console.error('Error inserting collaborators:', collabError);
        // Don't throw here, just log the error
      }
    }
    
    return {
      success: true,
      beatId
    };
  } catch (error) {
    console.error('Error in uploadBeat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during beat upload'
    };
  }
};
