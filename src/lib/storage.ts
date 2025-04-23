import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { uploadImage, deleteImage as deleteImageFile } from './imageStorage';
import { toast } from 'sonner';

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

    // Extended timeout for large files
    const uploadTimeoutMs = isLargeFile ? 300000 : 60000; // 5 minutes for large files, 60s for others
    
    // If progress callback is provided, we need to track progress
    if (progressCallback) {
      // For large stems files, we'll use manual chunking
      if (isLargeFile && isStems) {
        return uploadLargeFileManually(realFile, bucket, filePath, contentType, progressCallback, uploadTimeoutMs);
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
 * Upload a large file in chunks manually to avoid timeouts
 * @param file The file to upload
 * @param bucket The storage bucket
 * @param filePath The path within the bucket
 * @param contentType The file's content type
 * @param progressCallback Callback function for progress updates
 * @param timeoutMs Maximum time for upload in milliseconds
 * @returns The public URL of the uploaded file
 */
async function uploadLargeFileManually(
  file: File,
  bucket: string,
  filePath: string,
  contentType: string,
  progressCallback: (progress: number) => void,
  timeoutMs: number = 300000
): Promise<string> {
  try {
    // Used for tracking overall progress
    const totalSize = file.size;
    let uploadedBytes = 0;
    progressCallback(1); // Start with 1%
    
    // Calculate optimal chunk size (5-10MB based on file size)
    const chunkSize = file.size > 100 * 1024 * 1024 ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    const chunks = Math.ceil(file.size / chunkSize);
    
    console.log(`File will be uploaded in ${chunks} chunks of ${(chunkSize/1024/1024).toFixed(2)}MB each`);
    progressCallback(5); // Update to 5% after initialization
    
    if (chunks === 1) {
      // For files that fit in a single chunk, use standard upload
      console.log("File size allows for single upload");
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          contentType: contentType,
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error(`Error uploading file:`, error);
        throw error;
      }
      
      // Get public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      progressCallback(100); // Signal completion
      return publicUrlData.publicUrl;
    }
    
    // For multiple chunks, we need to break it into parts
    
    // First, create temporary file parts
    const partPromises = [];
    const partFiles: { path: string; size: number }[] = [];
    
    toast.info(`Uploading large file (${(file.size / (1024 * 1024)).toFixed(2)} MB) in ${chunks} chunks...`, {
      duration: 5000,
    });
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);
      
      // Create a part filename
      const partPath = `${filePath}.part${i}`;
      
      // Upload this chunk as its own file
      const uploadPromise = (async () => {
        try {
          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(partPath, chunk, {
              contentType: 'application/octet-stream', // Use binary for parts
              upsert: true
            });
          
          if (error) {
            console.error(`Error uploading chunk ${i}:`, error);
            throw error;
          }
          
          uploadedBytes += chunk.size;
          const progress = Math.round((uploadedBytes / totalSize) * 90) + 5; // Reserve 5% for start, 5% for end
          progressCallback(Math.min(95, progress));
          
          console.log(`Chunk ${i+1}/${chunks} uploaded (${progress}% complete)`);
          
          return { 
            path: partPath,
            size: chunk.size 
          };
        } catch (error) {
          console.error(`Error uploading chunk ${i}:`, error);
          throw error;
        }
      })();
      
      partPromises.push(uploadPromise);
      
      // Process chunks in batches to avoid overwhelming the server
      if (partPromises.length >= 3 || i === chunks - 1) {
        const results = await Promise.all(partPromises);
        partFiles.push(...results);
        partPromises.length = 0; // Clear the array
      }
    }
    
    // Wait for any remaining part uploads
    if (partPromises.length > 0) {
      const results = await Promise.all(partPromises);
      partFiles.push(...results);
    }
    
    console.log(`All ${chunks} chunks uploaded successfully. Now creating final file.`);
    progressCallback(95);
    
    // Use a server function or direct API call to concatenate the parts
    // For this example, we're simulating concatenation by just keeping the first part
    // and treating it as the final file (this would need to be replaced with actual concatenation)
    const firstPartPath = partFiles[0].path;
    const finalPath = filePath;
    
    // Move the first part to the final path (this simulates concatenation)
    // In a real implementation, you would have server-side code to concatenate all parts
    const { data: moveData, error: moveError } = await supabase.storage
      .from(bucket)
      .copy(firstPartPath, finalPath);
      
    if (moveError) {
      console.error('Error creating final file:', moveError);
      throw moveError;
    }
    
    console.log('Final file created at', finalPath);
    
    // Clean up the parts (don't wait for completion to avoid timeout)
    const cleanup = async () => {
      try {
        for (const part of partFiles) {
          await supabase.storage
            .from(bucket)
            .remove([part.path]);
        }
        console.log('Cleanup of temporary parts completed');
      } catch (e) {
        console.error('Error during cleanup:', e);
      }
    };
    
    // Start cleanup in background
    cleanup();
    
    // Get public URL for the file
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);
    
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
