
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
    
    console.log(`Uploading file ${realFile.name} (${realFile.type}) to ${bucket}/${filePath}`);
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Create a new XMLHttpRequest to manually track upload progress
      return new Promise<string>(async (resolve, reject) => {
        try {
          // First, get the upload URL from Supabase
          const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);
          if (!data || error) {
            reject(new Error('Failed to create upload URL'));
            return;
          }
          
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', data.signedUrl);
          
          // Set proper content type based on the file
          xhr.setRequestHeader('Content-Type', realFile.type || getMimeType(fileExt || ''));
          
          // Track upload progress events
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              // Calculate percentage and ensure we're reporting incremental updates
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              console.log(`Upload progress: ${percentComplete}%`);
              
              // Force progress updates at regular intervals even on iOS
              // This helps prevent the progress from jumping from 0 to 100
              if (percentComplete === 0) {
                progressCallback(1); // Start with 1% to show activity
              } else if (percentComplete === 100) {
                progressCallback(99); // Hold at 99% until fully complete
              } else {
                progressCallback(percentComplete);
              }
            }
          });
          
          // Handle successful completion
          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              // Get public URL for the file
              const { data: publicUrlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(filePath);
              
              // Force a small delay before showing 100% to ensure UI updates are visible
              setTimeout(() => {
                progressCallback(100); // Final completion
              }, 200);
              
              console.log(`File uploaded successfully with progress tracking: ${publicUrlData.publicUrl}`);
              resolve(publicUrlData.publicUrl);
            } else {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            reject(new Error('Network error during upload'));
          };
          
          // Add simulated progress updates for small files on iOS
          if (realFile.size < 5000000) { // For files under 5MB
            let simulatedProgress = 0;
            const progressInterval = setInterval(() => {
              simulatedProgress += 5;
              if (simulatedProgress < 90) {
                progressCallback(simulatedProgress);
              } else {
                clearInterval(progressInterval);
              }
            }, 200);
            
            // Clear interval if the upload completes or fails
            xhr.onload = async () => {
              clearInterval(progressInterval);
              if (xhr.status >= 200 && xhr.status < 300) {
                const { data: publicUrlData } = supabase.storage
                  .from(bucket)
                  .getPublicUrl(filePath);
                
                progressCallback(100);
                console.log(`File uploaded successfully with progress tracking: ${publicUrlData.publicUrl}`);
                resolve(publicUrlData.publicUrl);
              } else {
                reject(new Error(`Upload failed with status: ${xhr.status}`));
              }
            };
            
            xhr.onerror = () => {
              clearInterval(progressInterval);
              reject(new Error('Network error during upload'));
            };
          }
          
          // Send the raw file, not a converted array
          xhr.send(realFile);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      // Ensure we're passing the file directly, with proper content type
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          contentType: realFile.type || getMimeType(fileExt || ''),
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
