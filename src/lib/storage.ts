
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

    // Create a FormData object for manual XHR upload to track progress
    const formData = new FormData();
    formData.append('file', file);
    
    // If progress callback provided, use XHR for tracking progress
    if (progressCallback) {
      return new Promise((resolve, reject) => {
        // Get the upload URL from Supabase
        const uploadUrl = supabase.storage.from(bucket).getUploadUrl(filePath);
        
        // Create XHR request
        const xhr = new XMLHttpRequest();
        
        // Configure the request
        xhr.open('POST', `${supabase.storageUrl}/object/${bucket}/${filePath}`);
        
        // Add authentication headers
        xhr.setRequestHeader('Authorization', `Bearer ${supabase.auth.session()?.access_token}`);
        
        // Track upload progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            console.log(`Upload progress: ${percentComplete}%`);
            progressCallback(percentComplete);
          }
        };
        
        // Handle completion
        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Upload completed successfully');
            // Get public URL for the file
            const { data: publicUrlData } = supabase.storage
              .from(bucket)
              .getPublicUrl(filePath);
            
            resolve(publicUrlData.publicUrl);
          } else {
            reject(new Error(`Upload failed with status: ${xhr.status}`));
          }
        };
        
        // Handle errors
        xhr.onerror = () => {
          reject(new Error('Upload failed'));
        };
        
        // Send the request with file data
        xhr.send(file);
      });
    }
    
    // If no progress tracking needed, use standard upload
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
