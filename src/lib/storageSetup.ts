
import { supabase } from '@/integrations/supabase/client';

/**
 * Ensures the required storage buckets exist with proper policies
 */
export const setupStorageBuckets = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Setting up storage buckets...');
    
    // Check if avatars bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return { success: false, message: `Failed to list buckets: ${listError.message}` };
    }
    
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    const coversBucket = buckets?.find(bucket => bucket.name === 'covers');
    
    if (!avatarsBucket) {
      console.log('Avatars bucket not found - it should be created via SQL migration');
      return { success: false, message: 'Avatars bucket does not exist. Please create it via SQL migration.' };
    }
    
    if (!coversBucket) {
      console.log('Covers bucket not found - it should be created via SQL migration');
      return { success: false, message: 'Covers bucket does not exist. Please create it via SQL migration.' };
    }
    
    console.log('Storage buckets are properly configured');
    return { success: true, message: 'Storage buckets are properly configured' };
    
  } catch (error) {
    console.error('Error setting up storage buckets:', error);
    return { success: false, message: `Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

/**
 * Tests storage bucket access and permissions
 */
export const testStorageAccess = async (): Promise<{ success: boolean; message: string }> => {
  try {
    console.log('Testing storage access...');
    
    // Test avatars bucket
    const { data: avatarsData, error: avatarsError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });
    
    if (avatarsError) {
      console.error('Error accessing avatars bucket:', avatarsError);
      return { success: false, message: `Cannot access avatars bucket: ${avatarsError.message}` };
    }
    
    // Test covers bucket
    const { data: coversData, error: coversError } = await supabase.storage
      .from('covers')
      .list('', { limit: 1 });
    
    if (coversError) {
      console.error('Error accessing covers bucket:', coversError);
      return { success: false, message: `Cannot access covers bucket: ${coversError.message}` };
    }
    
    console.log('Storage access test passed');
    return { success: true, message: 'Storage access test passed' };
    
  } catch (error) {
    console.error('Error testing storage access:', error);
    return { success: false, message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
