
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Create a type to represent a file-like object with a URL
export type FileOrUrl = File | { url: string };

// Type guard to check if the object is a File
export function isFile(file: FileOrUrl): file is File {
  return (file as File).lastModified !== undefined;
}

/**
 * Uploads a file to Supabase storage
 * @param file The file to upload
 * @param bucket The storage bucket to use (e.g., 'beats', 'covers')
 * @param path Optional path within the bucket
 * @param progressCallback Optional callback function to track upload progress
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: FileOrUrl, 
  bucket: 'beats' | 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // If we're passed an object with a URL, just return the URL (it's already uploaded)
    if ('url' in file && typeof file.url === 'string') {
      return file.url;
    }
    
    // Otherwise, treat as a real File object
    const realFile = file as File;
    
    // Generate a unique filename to prevent collisions
    const fileExt = realFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading file to ${bucket}/${filePath}`);
    console.log(`File type: ${realFile.type}`);
    
    // Determine the proper content type
    let contentType = realFile.type;
    
    // Ensure image content types are properly set
    if (contentType.startsWith('image/')) {
      // For images, make sure we use the correct image content type
      contentType = realFile.type;
    } else if (bucket === 'covers' || bucket === 'avatars') {
      // If uploading to covers or avatars, but content type isn't set, use a default
      if (!contentType || contentType === 'application/octet-stream') {
        const imageExt = fileExt?.toLowerCase();
        if (imageExt === 'jpg' || imageExt === 'jpeg') {
          contentType = 'image/jpeg';
        } else if (imageExt === 'png') {
          contentType = 'image/png';
        } else if (imageExt === 'gif') {
          contentType = 'image/gif';
        } else if (imageExt === 'webp') {
          contentType = 'image/webp';
        }
      }
    }
    
    console.log(`Using content type: ${contentType}`);
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Upload with progress tracking
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Start with some initial progress
          progressCallback(10);
          
          // Upload the file
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, realFile, {
              cacheControl: '3600',
              upsert: true, // Allow overwriting existing files
              contentType: contentType // Explicitly set content type
            });
          
          if (error) {
            console.error(`Error uploading to ${bucket}/${filePath}:`, error);
            reject(error);
            return;
          }

          // Update progress
          progressCallback(60);
          
          // Get public URL for the file
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(data.path);
          
          // Complete progress
          progressCallback(100);
          
          console.log(`File uploaded successfully: ${publicUrlData.publicUrl}`);
          resolve(publicUrlData.publicUrl);
        } catch (error) {
          console.error('Error in file upload promise:', error);
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          cacheControl: '3600',
          upsert: true, // Always allow overwriting existing files
          contentType: contentType // Explicitly set content type
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
