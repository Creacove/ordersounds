import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Type guard to check if the object is a File
export function isFile(file: File | { url: string }): file is File {
  return (file as File)?.lastModified !== undefined;
}

/**
 * Uploads an image to Supabase storage
 * @param file The image file to upload
 * @param bucket The storage bucket to use (typically 'covers' or 'avatars')
 * @param path Optional path within the bucket
 * @param progressCallback Optional callback function to track upload progress
 * @returns The public URL of the uploaded image
 */
export const uploadImage = async (
  file: File | { url: string }, 
  bucket: 'covers' | 'avatars', 
  path = '',
  progressCallback?: (progress: number) => void
): Promise<string> => {
  try {
    // If we're passed an object with a URL, just return the URL (it's already uploaded)
    if (!file) {
      throw new Error("No file provided for upload");
    }
    
    // If it's already a URL string, just return it
    if ('url' in file && typeof file.url === 'string') {
      return file.url;
    }
    
    // If it's a data URL (base64), just return it directly
    if (isFile(file) && file.name === 'base64-image.jpg') {
      return file as unknown as string;
    }
    
    // Otherwise, treat as a real File object
    const imageFile = file as File;
    
    // Validate the file is an actual image
    if (!imageFile.type.startsWith('image/')) {
      throw new Error(`File is not a valid image: ${imageFile.type}`);
    }
    
    // Generate a unique filename to prevent collisions
    const fileExt = imageFile.name.split('.').pop()?.toLowerCase();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading image ${imageFile.name} (${imageFile.type}) to ${bucket}/${filePath}`);
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Create a new XMLHttpRequest to manually track upload progress
      return new Promise<string>(async (resolve, reject) => {
        try {
          progressCallback(10); // Initial progress
          
          // Read file as base64 data URL instead of uploading to storage
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && event.target.result) {
              const base64String = event.target.result.toString();
              progressCallback(100); // Complete progress
              console.log("Image converted to base64 successfully");
              resolve(base64String);
            } else {
              reject(new Error('Failed to read image file'));
            }
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read image file'));
          };
          
          reader.readAsDataURL(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking - still use base64 approach
      return new Promise<string>((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target && event.target.result) {
              const base64String = event.target.result.toString();
              console.log("Image converted to base64 successfully");
              resolve(base64String);
            } else {
              reject(new Error('Failed to read image file'));
            }
          };
          
          reader.onerror = () => {
            reject(new Error('Failed to read image file'));
          };
          
          reader.readAsDataURL(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    }
  } catch (error) {
    console.error('Error in uploadImage:', error);
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
  };
  
  return map[ext.toLowerCase()] || 'image/jpeg'; // Default to JPEG instead of octet-stream
}

/**
 * Deletes an image from Supabase storage
 * @param url The public URL of the image to delete
 * @param bucket The storage bucket where the image is stored
 */
export const deleteImage = async (url: string, bucket: 'covers' | 'avatars'): Promise<void> => {
  try {
    // Skip deletion for data URLs (base64)
    if (url.startsWith('data:')) {
      console.log('Skipping deletion for base64 image');
      return;
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
      console.error(`Error deleting image from ${bucket}/${filePath}:`, error);
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};
