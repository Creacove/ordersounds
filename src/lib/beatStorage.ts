import { supabase } from '@/integrations/supabase/client';
import { uploadFile, FileOrUrl, isFile } from './storage';
import { uploadImage } from './imageStorage';

/**
 * Uploads a beat to the database
 * @param beatData Beat details
 * @param fullTrackFileOrUrl Full track file or URL
 * @param previewFile Preview track file
 * @param imageFile Cover image file
 * @param stemsFile Stems file
 * @param producerId Producer ID
 * @param producerName Producer name
 * @param collaborators Collaborators
 * @param licenseTypes License types
 * @param previewUrl Pre-uploaded preview URL
 * @param imageUrl Pre-uploaded image URL
 * @returns Response object with success status and data or error
 */
export const uploadBeat = async (
  beatData: any,
  fullTrackFileOrUrl: FileOrUrl,
  previewFile: File | null,
  imageFile: File | null,
  stemsFile: File | null,
  producerId: string,
  producerName: string,
  collaborators: any[],
  licenseTypes: string[],
  previewUrl: string = '',
  imageUrl: string | null = null
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    console.log('Starting beat upload process');
    
    // Upload the full track if it's a File
    let fullTrackUrl: string;
    if (isFile(fullTrackFileOrUrl)) {
      fullTrackUrl = await uploadFile(fullTrackFileOrUrl, 'beats', 'full-tracks');
    } else if ('url' in fullTrackFileOrUrl) {
      fullTrackUrl = fullTrackFileOrUrl.url;
    } else {
      throw new Error('Invalid full track file');
    }
    console.log('Full track URL:', fullTrackUrl);
    
    // Upload the preview if provided, or use the URL
    let finalPreviewUrl: string;
    if (previewFile) {
      finalPreviewUrl = await uploadFile(previewFile, 'beats', 'previews');
    } else if (previewUrl) {
      finalPreviewUrl = previewUrl;
    } else {
      throw new Error('No preview file or URL provided');
    }
    console.log('Preview URL:', finalPreviewUrl);
    
    // Upload the cover image if provided, or use the URL
    let finalImageUrl: string;
    if (imageFile) {
      finalImageUrl = await uploadImage(imageFile, 'covers', 'beats');
    } else if (imageUrl) {
      finalImageUrl = imageUrl;
    } else {
      throw new Error('No image file or URL provided');
    }
    console.log('Image URL:', finalImageUrl);
    
    // Upload stems if provided
    let stemsUrl: string | null = null;
    if (stemsFile) {
      stemsUrl = await uploadFile(stemsFile, 'beats', 'stems');
      console.log('Stems URL:', stemsUrl);
    }
    
    // Create the beat in the database
    const { data: beatInsertData, error: beatInsertError } = await supabase
      .from('beats')
      .insert({
        title: beatData.title,
        description: beatData.description,
        genre: beatData.genre,
        track_type: beatData.track_type,
        bpm: beatData.bpm,
        key: beatData.key,
        tags: beatData.tags,
        status: beatData.status,
        cover_image: finalImageUrl,
        audio_url: fullTrackUrl,
        preview_url: finalPreviewUrl,
        stems_url: stemsUrl,
        producer_id: producerId,
        producer_name: producerName,
        basic_license_price_local: beatData.basic_license_price_local,
        basic_license_price_diaspora: beatData.basic_license_price_diaspora,
        premium_license_price_local: beatData.premium_license_price_local,
        premium_license_price_diaspora: beatData.premium_license_price_diaspora,
        exclusive_license_price_local: beatData.exclusive_license_price_local,
        exclusive_license_price_diaspora: beatData.exclusive_license_price_diaspora,
        custom_license_price_local: beatData.custom_license_price_local,
        custom_license_price_diaspora: beatData.custom_license_price_diaspora,
        license_type: beatData.license_type,
        license_terms: beatData.license_terms
      })
      .select()
      .single();
      
    if (beatInsertError) {
      throw beatInsertError;
    }
    
    const beatId = beatInsertData.id;
    console.log('Beat created with ID:', beatId);
    
    // Insert collaborators
    if (collaborators.length > 0) {
      const collaboratorInserts = collaborators.map(c => ({
        beat_id: beatId,
        name: c.name,
        email: c.email,
        role: c.role,
        percentage: c.percentage
      }));
      
      const { error: collaboratorInsertError } = await supabase
        .from('collaborators')
        .insert(collaboratorInserts);
        
      if (collaboratorInsertError) {
        console.error('Error inserting collaborators:', collaboratorInsertError);
        // Continue despite collaborator insert error
      }
    }
    
    return {
      success: true,
      data: beatInsertData
    };
  } catch (error) {
    console.error('Error uploading beat:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
