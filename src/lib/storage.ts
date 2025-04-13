
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
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Use standard upload with progress tracking
      return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Get the configuration info needed for the direct upload
        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath); // Use this to determine the base URL
          
        // Extract the base URL from the publicUrl
        const baseStorageUrl = publicUrl.split(`/${bucket}/`)[0];
        const uploadUrl = `${baseStorageUrl}/object/${bucket}/${filePath}`;
        xhr.open('PUT', uploadUrl, true);
        
        // Use the project URL from the environment/config instead of accessing protected headers
        // Get the API key from the constants in the client instance
        const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXpsd2t4aGJ6YWpkaXZybGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mzg5MzAsImV4cCI6MjA1ODMxNDkzMH0.TwIkGiLNiuxTdzbAxv6zBgbK1zIeNkhZ6qeX6OmhWOk";
        
        // Set appropriate headers for the file type
        xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
        xhr.setRequestHeader('x-upsert', 'true');
        xhr.setRequestHeader('Cache-Control', '3600');
        
        // For images, ensure content type is set correctly
        xhr.setRequestHeader('Content-Type', realFile.type);
        
        // Track upload progress events
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            // Calculate percentage and ensure we're reporting incremental updates
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`Upload progress: ${percentComplete}%`);
            
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
            console.error(`Upload failed with status: ${xhr.status}, response:`, xhr.responseText);
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          console.error('Network error during upload');
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
              console.error(`Upload failed with status: ${xhr.status}, response:`, xhr.responseText);
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          };
          
          xhr.onerror = () => {
            clearInterval(progressInterval);
            console.error('Network error during upload');
            reject(new Error('Network error during upload'));
          };
        }
        
        // Start the upload with the proper data format
        xhr.send(realFile);
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          cacheControl: '3600',
          upsert: true, // Changed to true to overwrite existing files with same name
          contentType: realFile.type // Ensure content type is set correctly
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
