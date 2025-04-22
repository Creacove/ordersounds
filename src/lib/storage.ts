import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, deleteImage as deleteImageFile } from './imageStorage';

// Create a type to represent a file-like object with a URL
export type FileOrUrl = File | { url: string };

// Re-export the isFile function from imageStorage
export { isFile } from './imageStorage';

// Re-export uploadImage and deleteImage functions
export const uploadImageFile = uploadImage;
export const deleteImage = deleteImageFile;

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
    // If this is an image upload (covers or avatars), use the dedicated image upload function
    if (bucket === 'covers' || bucket === 'avatars') {
      return uploadImage(file, bucket, path, progressCallback);
    }
    
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
    
    console.log(`Uploading file ${realFile.name} (${realFile.type}) to ${bucket}/${filePath}`);
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Create a new XMLHttpRequest to manually track upload progress
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Since we're experiencing RLS policy issues, let's try a direct upload
          // This is likely because the user isn't authenticated or doesn't have proper permissions
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, realFile, {
              contentType: realFile.type || getMimeType(fileExt || ''),
              cacheControl: '3600',
              upsert: true // Changed to true to overwrite existing files if needed
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
          progressCallback(100); // Signal completion
          resolve(publicUrlData.publicUrl);
        } catch (error) {
          console.error("Error in direct upload:", error);
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          contentType: realFile.type || getMimeType(fileExt || ''),
          cacheControl: '3600',
          upsert: true // Changed to true to overwrite existing files
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
 * Get MIME type from file extension
 * @param ext File extension
 * @returns MIME type string
 */
function getMimeType(ext: string): string {
  const map: {[key: string]: string} = {
    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    m4a: 'audio/mp4',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    
    // Archives
    zip: 'application/zip',
    
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

/**
 * Deletes a file from Supabase storage
 * @param url The public URL of the file to delete
 * @param bucket The storage bucket where the file is stored
 */
export const deleteFile = async (url: string, bucket: 'beats' | 'covers' | 'avatars'): Promise<void> => {
  try {
    // If this is an image file, use the dedicated image delete function
    if (bucket === 'covers' || bucket === 'avatars') {
      return deleteImageFile(url, bucket);
    }
    
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
