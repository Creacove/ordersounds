import { supabase } from '@/integrations/supabase/client';
import { uploadFile, FileOrUrl, isFile, validateImageUrl } from './storage';
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
  stems_url?: string;
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
  fullTrackFile: FileOrUrl,
  previewFile: File | null,
  coverImageFile: FileOrUrl,
  stemsFile: File | null,
  producerId: string,
  producerName: string,
  collaborators: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    percentage: number;
  }>,
  selectedLicenseTypes: string[] = ['basic'],
  previewUrl?: string
): Promise<{success: boolean; beatId?: string; error?: string}> => {
  try {
    console.log('Preparing beat data for database insertion...');
    
    // We assume all files have already been uploaded at this point
    // and we're just storing the references in the database
    
    let finalPreviewUrl = previewUrl || '';
    let fullTrackUrl = '';
    let coverImageUrl = '';
    let stemsUrl = '';
    
    // Only upload files that haven't been uploaded yet
    if (!previewUrl && previewFile) {
      console.log('No preview URL provided, uploading preview file...');
      finalPreviewUrl = await uploadFile(previewFile, 'beats', 'previews');
    }

    if (fullTrackFile) {
      if (isFile(fullTrackFile)) {
        // It's a real File object that needs uploading
        const fullTrackFolder = selectedLicenseTypes.includes('premium') || 
                         selectedLicenseTypes.includes('exclusive') 
                         ? 'wav-tracks' : 'full-tracks';
        fullTrackUrl = await uploadFile(fullTrackFile, 'beats', fullTrackFolder);
      } else {
        // It's our custom object with URL already set
        fullTrackUrl = fullTrackFile.url;
        
        // Validate the URL is accessible
        const isValid = await validateImageUrl(fullTrackUrl);
        if (!isValid) {
          console.warn('Full track URL is not accessible, will need to be re-uploaded');
        }
      }
    }
    
    if (coverImageFile) {
      if (isFile(coverImageFile)) {
        // Real File object
        coverImageUrl = await uploadFile(coverImageFile, 'covers', 'beats');
        
        // Validate the image URL
        const isValid = await validateImageUrl(coverImageUrl);
        if (!isValid) {
          console.warn('Cover image URL validation failed after upload, but continuing');
        }
      } else {
        // Our custom object
        coverImageUrl = coverImageFile.url;
        
        // Validate the URL is accessible
        const isValid = await validateImageUrl(coverImageUrl);
        if (!isValid) {
          console.warn('Cover image URL is not accessible, attempting to fix or re-upload');
          
          // Check if the URL is a relative path and needs to be converted to an absolute URL
          if (coverImageUrl.startsWith('/')) {
            const baseUrl = window.location.origin;
            coverImageUrl = `${baseUrl}${coverImageUrl}`;
            console.log('Updated cover image URL to absolute path:', coverImageUrl);
          }
        }
      }
    }
    
    if (stemsFile) {
      stemsUrl = await uploadFile(stemsFile, 'beats', 'stems');
    }

    console.log('Building beat data for database insertion...');
    
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
      audio_preview: finalPreviewUrl,
      audio_file: fullTrackUrl,
      favorites_count: 0,
      purchase_count: 0,
      plays: 0,
      license_terms: beatInfo.license_terms || ''
    };
    
    // Add stems URL if available
    if (stemsUrl) {
      beatData.stems_url = stemsUrl;
    }
    
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

    console.log('Beat data ready for insertion, cover image URL:', coverImageUrl);

    // Start a transaction for beat + royalty splits insertion
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
      
      // Ensure the cover_image URL is valid
      const coverImageUrl = beat.cover_image || '';
      
      return {
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: producerName,
        cover_image_url: coverImageUrl,
        preview_url: beat.audio_preview || '',
        full_track_url: beat.audio_file || '',
        genre: beat.genre || '',
        track_type: beat.track_type || '',
        bpm: beat.bpm || 0,
        tags: beat.tags || [],
        description: beat.description || '',
        created_at: beat.upload_date || new Date().toISOString(),
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
 * Deletes a beat and its associated files
 */
const safeDeleteFile = async (url: string, bucket: 'beats' | 'covers' | 'avatars') => {
  if (url) {
    try {
      // Extract file path from URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // The file path is typically the last part after the bucket name
      const bucketIndex = pathParts.findIndex(part => part === bucket);
      let filePath = '';
      
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        // Extract everything after the bucket name
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      } else {
        // Fallback: just take the last part as the filename
        filePath = pathParts[pathParts.length - 1];
      }
      
      // Delete file from storage
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) {
        console.error(`Error deleting file from ${bucket}/${filePath}:`, error);
        throw error;
      }
    } catch (error) {
      console.warn(`Failed to delete file (${url}), continuing with beat deletion:`, error);
    }
  }
};

export const deleteBeat = async (beatId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, get the beat data to access file URLs
    const { data: beat, error: getBeatError } = await supabase
      .from('beats')
      .select('cover_image, audio_file, audio_preview, stems_url')
      .eq('id', beatId)
      .single();
    
    if (getBeatError) {
      console.error('Error getting beat data for deletion:', getBeatError);
      return { success: false, error: `Error retrieving beat: ${getBeatError.message}` };
    }
    
    // Try to delete each associated file
    if (beat) {
      // Delete cover image
      await safeDeleteFile(beat.cover_image, 'covers');
      
      // Delete audio files
      await safeDeleteFile(beat.audio_file, 'beats');
      await safeDeleteFile(beat.audio_preview, 'beats');
      
      // Delete stems if available
      if (beat.stems_url) {
        await safeDeleteFile(beat.stems_url, 'beats');
      }
    }
    
    // Delete royalty splits first (foreign key constraint)
    const { error: royaltyDeleteError } = await supabase
      .from('royalty_splits')
      .delete()
      .eq('beat_id', beatId);
    
    if (royaltyDeleteError) {
      console.warn('Error deleting royalty splits:', royaltyDeleteError);
      // Continue anyway, as this shouldn't block the beat deletion
    }
    
    // Delete user favorites for this beat - directly from table instead of using RPC
    try {
      await supabase
        .from('user_favorites')
        .delete()
        .eq('beat_id', beatId);
    } catch (error) {
      console.warn('Error deleting favorites:', error);
      // Continue anyway
    }
    
    // Finally, delete the beat record
    const { error: beatDeleteError } = await supabase
      .from('beats')
      .delete()
      .eq('id', beatId);
    
    if (beatDeleteError) {
      console.error('Error deleting beat record:', beatDeleteError);
      return { success: false, error: `Error deleting beat: ${beatDeleteError.message}` };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting beat:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during beat deletion' 
    };
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
