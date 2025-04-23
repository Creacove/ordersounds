
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
    
    // Determine the content type from the file or extension
    const contentType = realFile.type || getMimeType(fileExt || '');
    console.log(`Using content type: ${contentType}`);
    
    // Special handling for large files (like stems)
    const isLargeFile = realFile.size > 50 * 1024 * 1024; // Over 50MB
    const isStems = path === 'stems';

    // Set appropriate chunk size based on file size
    let chunkSize = 5 * 1024 * 1024; // Default 5MB chunks
    if (isLargeFile) {
      chunkSize = 10 * 1024 * 1024; // 10MB chunks for large files
    }
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // For large stems files, we'll use chunked upload with progress tracking
      if (isLargeFile && isStems) {
        return uploadLargeFile(realFile, bucket, filePath, contentType, progressCallback);
      }
      
      return new Promise<string>(async (resolve, reject) => {
        try {
          // Initial progress indication
          progressCallback(5);
          
          // Track upload start time for progress estimation
          const startTime = Date.now();
          const fileSize = realFile.size;
          let lastProgressUpdate = 5;
          
          // Setup progress polling for larger files
          const progressInterval = setInterval(() => {
            if (lastProgressUpdate >= 95) {
              clearInterval(progressInterval);
              return;
            }
            
            // Calculate progress based on elapsed time and file size
            const elapsedMs = Date.now() - startTime;
            const estimatedProgress = Math.min(
              95, // Cap at 95% until we get completion confirmation
              Math.max(
                lastProgressUpdate + 5, // Always increase by at least 5%
                Math.round((elapsedMs / (fileSize / 50000)) * 85) + 5 // Estimate based on size
              )
            );
            
            lastProgressUpdate = estimatedProgress;
            progressCallback(estimatedProgress);
          }, 1000); // Update every second
          
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, realFile, {
              contentType: contentType,
              cacheControl: '3600',
              upsert: true
            });
          
          // Clear the progress interval
          clearInterval(progressInterval);
          
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
          console.error("Error in upload:", error);
          reject(error);
        }
      });
    } else {
      // Standard upload without progress tracking
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, realFile, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
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
 * Upload a large file in chunks to avoid timeouts
 * @param file The file to upload
 * @param bucket The storage bucket
 * @param filePath The path within the bucket
 * @param contentType The file's content type
 * @param progressCallback Callback function for progress updates
 * @returns The public URL of the uploaded file
 */
async function uploadLargeFile(
  file: File,
  bucket: string,
  filePath: string,
  contentType: string,
  progressCallback: (progress: number) => void
): Promise<string> {
  try {
    // Used for tracking overall progress
    const totalSize = file.size;
    let uploadedBytes = 0;
    progressCallback(1); // Start with 1%
    
    // Calculate optimal chunk size (5-10MB based on file size)
    const chunkSize = file.size > 100 * 1024 * 1024 ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    
    // Create upload session
    const { data: session, error: sessionError } = await supabase.storage.createBucketUploadSession({
      bucket,
      file,
      fileName: filePath,
      chunkSize,
    });
    
    if (sessionError) {
      console.error('Error creating upload session:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      throw new Error('Failed to create upload session');
    }
    
    console.log(`Upload session created for ${filePath} with chunk size ${chunkSize/1024/1024}MB`);
    progressCallback(5); // Update to 5% after session creation
    
    // Upload each chunk
    const chunks = Math.ceil(file.size / chunkSize);
    console.log(`File will be uploaded in ${chunks} chunks`);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      try {
        // Upload this chunk
        const { error } = await supabase.storage.uploadChunk({
          bucket,
          file: chunk,
          fileName: filePath,
          sessionId: session.sessionId,
          chunkIndex: i,
        });
        
        if (error) {
          console.error(`Error uploading chunk ${i}:`, error);
          throw error;
        }
        
        uploadedBytes += chunk.size;
        const progress = Math.round((uploadedBytes / totalSize) * 100);
        progressCallback(Math.min(99, progress)); // Cap at 99% until fully complete
        console.log(`Chunk ${i+1}/${chunks} uploaded (${progress}% complete)`);
      } catch (error) {
        console.error(`Error uploading chunk ${i}:`, error);
        throw error;
      }
    }
    
    // Complete the upload session
    const { data, error } = await supabase.storage.completeUploadSession({
      bucket,
      fileName: filePath,
      sessionId: session.sessionId,
    });
    
    if (error) {
      console.error('Error completing upload session:', error);
      throw error;
    }
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);
    
    console.log(`Large file uploaded successfully: ${publicUrlData.publicUrl}`);
    progressCallback(100); // Signal completion
    
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error in chunked upload:', error);
    throw error;
  }
}

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
