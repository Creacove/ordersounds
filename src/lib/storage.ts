import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Create a type to represent a file-like object with a URL
export type FileOrUrl = File | { url: string };

// Type guard to check if the object is a File
export function isFile(file: FileOrUrl): file is File {
  return (file as File).lastModified !== undefined;
}

/**
 * Validates that a URL is accessible
 * @param url The URL to validate
 * @returns True if the URL is valid and accessible, false otherwise
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  if (!url) return false;
  
  // Don't try to validate placeholder URLs
  if (url === '/placeholder.svg') return true;
  
  try {
    // Handle relative URLs
    let fullUrl = url;
    if (url.startsWith('/') && !url.startsWith('//')) {
      fullUrl = `${window.location.origin}${url}`;
    }
    
    // For URLs that might be storage references without full URL
    if (url.includes('storage/v1/object/public/') && !url.includes('http')) {
      fullUrl = `${supabase.supabaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    
    // Try a HEAD request first - it's faster
    const response = await fetch(fullUrl, { 
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (response.ok) return true;
    
    // If HEAD failed, try a regular GET as fallback
    const getResponse = await fetch(fullUrl, { 
      method: 'GET',
      mode: 'cors',
      cache: 'no-cache' 
    });
    
    return getResponse.ok;
  } catch (error) {
    console.warn('Image URL validation failed:', error);
    return false;
  }
};

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
      // Make sure the URL is valid and accessible
      try {
        await fetch(file.url, { method: 'HEAD' });
        return file.url;
      } catch (error) {
        console.warn('URL validation failed, will re-upload:', error);
        // Continue with upload if URL validation fails
      }
    }
    
    // Otherwise, treat as a real File object
    const realFile = file as File;
    
    // Generate a unique filename to prevent collisions
    const fileExt = realFile.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;
    
    console.log(`Uploading file to ${bucket}/${filePath}`);
    
    // Ensure the bucket exists
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === bucket)) {
        console.warn(`Bucket ${bucket} does not exist, creating it`);
        await supabase.storage.createBucket(bucket, { public: true });
      }
    } catch (error) {
      console.error('Error checking/creating bucket:', error);
      // Continue anyway, the upload might still work
    }

    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // Create a new XMLHttpRequest to manually track upload progress
      return new Promise<string>(async (resolve, reject) => {
        try {
          // First, get the upload URL from Supabase
          const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(filePath);
          if (!data || error) {
            reject(new Error(`Failed to create upload URL: ${error?.message || 'Unknown error'}`));
            return;
          }
          
          const xhr = new XMLHttpRequest();
          xhr.open('PUT', data.signedUrl);
          
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
              
              if (!publicUrlData || !publicUrlData.publicUrl) {
                reject(new Error('Failed to get public URL for uploaded file'));
                return;
              }
              
              // Verify the URL is accessible
              try {
                await fetch(publicUrlData.publicUrl, { method: 'HEAD' });
              } catch (error) {
                console.warn('Uploaded file URL validation failed:', error);
                // Continue anyway, the URL might still be valid
              }
              
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
          
          // Start the upload
          xhr.send(realFile);
        } catch (error) {
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
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
    if (!url) {
      console.warn('No URL provided to deleteFile, skipping');
      return;
    }
    
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
    console.error('Error deleting file:', error);
    throw error;
  }
};
