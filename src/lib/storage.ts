
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket to use (e.g., 'beats', 'covers')
 * @param path Optional path within the bucket
 * @param progressCallback Optional callback function to track upload progress
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: File, 
  bucket: 'beats' | 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // Generate a unique filename to prevent collisions
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading file to ${bucket}/${filePath}`);
    
    // If progress callback provided, use XHR for tracking progress
    if (progressCallback) {
      // Use Supabase's built-in progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percentComplete = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${percentComplete}%`);
            progressCallback(percentComplete);
          }
        });
        
      if (error) {
        console.error(`Error uploading to ${bucket}/${filePath}:`, error);
        throw error;
      }
      
      // Get public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      console.log(`File uploaded successfully with progress tracking: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error(`Error uploading to ${bucket}/${filePath}:`, error);
        throw error;
      }
      
      // Get public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Deletes a file from Supabase storage
 * @param url The public URL of the file to delete
 * @param bucket The storage bucket where the file is stored
 */
export const deleteFile = async (url: string, bucket: 'beats' | 'covers' | 'avatars'): Promise<void> => {
  try {
    // Extract file path from URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // The last part of the path should be the filename
    const filePath = pathParts[pathParts.length - 1];
    
    // Delete file from storage
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error(`Error deleting file from ${bucket}/${filePath}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
