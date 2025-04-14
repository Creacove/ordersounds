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
    
    if ('url' in file && typeof file.url === 'string') {
      return file.url;
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
          // Since onUploadProgress isn't supported in FileOptions, we'll use XMLHttpRequest instead
          const xhr = new XMLHttpRequest();
          const uploadOptions = {
            contentType: imageFile.type || getMimeType(fileExt || ''),
            cacheControl: '3600',
            upsert: false
          };
          
          // Get pre-signed URL for upload
          const { data: { signedURL, path: uploadPath }, error: urlError } = await supabase.storage
            .from(bucket)
            .createSignedUploadUrl(filePath);
            
          if (urlError) {
            console.error(`Error getting signed URL for ${bucket}/${filePath}:`, urlError);
            reject(urlError);
            return;
          }
          
          // Track upload progress with XMLHttpRequest
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              progressCallback(percentComplete < 100 ? percentComplete : 99);
            }
          };
          
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              // Get public URL for the file
              const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(uploadPath);
              
              // Final completion
              setTimeout(() => {
                progressCallback(100);
              }, 200);
              
              // Ensure the URL is a string and valid
              if (!publicUrlData?.publicUrl) {
                reject(new Error('Failed to get public URL for uploaded image'));
                return;
              }
              
              console.log(`Image uploaded successfully with progress tracking: ${publicUrlData.publicUrl}`);
              resolve(publicUrlData.publicUrl);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('Upload failed due to network error'));
          };
          
          xhr.open('PUT', signedURL);
          xhr.setRequestHeader('Content-Type', uploadOptions.contentType);
          xhr.setRequestHeader('Cache-Control', uploadOptions.cacheControl);
          xhr.send(imageFile);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, imageFile, {
          contentType: imageFile.type || getMimeType(fileExt || ''),
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
      
      // Ensure the URL is a string and valid
      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }
      
      console.log(`Image uploaded successfully: ${publicUrlData.publicUrl}`);
      return publicUrlData.publicUrl;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
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
