
import { supabase } from '@/integrations/supabase/client';
import { uploadImage, dataURLtoBlob } from '@/lib/imageStorage';

export interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  errors: string[];
}

/**
 * Migrates user profile pictures from base64 to Supabase storage URLs
 * This function should be run once to clean up existing data
 */
export const migrateBase64ImagesToStorage = async (): Promise<MigrationResult> => {
  const result: MigrationResult = {
    totalUsers: 0,
    migratedUsers: 0,
    failedUsers: 0,
    errors: []
  };

  try {
    console.log('Starting migration of base64 images to storage...');
    
    // Get all users with base64 profile pictures
    const { data: users, error } = await supabase
      .from('users')
      .select('id, profile_picture, full_name, stage_name')
      .not('profile_picture', 'is', null)
      .like('profile_picture', 'data:image%');

    if (error) {
      throw error;
    }

    result.totalUsers = users?.length || 0;
    console.log(`Found ${result.totalUsers} users with base64 profile pictures`);

    if (!users || users.length === 0) {
      console.log('No users with base64 profile pictures found');
      return result;
    }

    // Process each user
    for (const user of users) {
      try {
        console.log(`Processing user ${user.id}: ${user.full_name || user.stage_name}`);
        
        // Convert base64 to blob
        const blob = dataURLtoBlob(user.profile_picture);
        
        // Create a file from the blob
        const fileExt = user.profile_picture.split(';')[0].split('/')[1] || 'png';
        const fileName = `migrated_${user.id}.${fileExt}`;
        const file = new File([blob], fileName, { type: `image/${fileExt}` });
        
        // Upload to storage
        const storageUrl = await uploadImage(file, 'avatars', 'migrated');
        
        // Update user record with storage URL
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_picture: storageUrl })
          .eq('id', user.id);
          
        if (updateError) {
          throw updateError;
        }
        
        result.migratedUsers++;
        console.log(`Successfully migrated user ${user.id} to ${storageUrl}`);
        
      } catch (error) {
        console.error(`Failed to migrate user ${user.id}:`, error);
        result.failedUsers++;
        result.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Migration completed. Migrated: ${result.migratedUsers}, Failed: ${result.failedUsers}`);
    return result;
    
  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

/**
 * Cleans up corrupted user records with oversized profile_picture data
 */
export const cleanupCorruptedRecords = async (): Promise<{ cleaned: number; errors: string[] }> => {
  const result = { cleaned: 0, errors: [] };
  
  try {
    console.log('Starting cleanup of corrupted records...');
    
    // Find users with very large profile_picture fields (likely corrupted base64)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, profile_picture, full_name, stage_name')
      .not('profile_picture', 'is', null);

    if (error) {
      throw error;
    }

    if (!users) {
      console.log('No users found');
      return result;
    }

    // Check for oversized profile pictures (> 100KB base64 is likely corrupted)
    const corruptedUsers = users.filter(user => 
      user.profile_picture && 
      user.profile_picture.length > 100000 && 
      user.profile_picture.startsWith('data:image')
    );

    console.log(`Found ${corruptedUsers.length} users with potentially corrupted profile pictures`);

    for (const user of corruptedUsers) {
      try {
        // Clear the corrupted profile picture
        const { error: updateError } = await supabase
          .from('users')
          .update({ profile_picture: null })
          .eq('id', user.id);
          
        if (updateError) {
          throw updateError;
        }
        
        result.cleaned++;
        console.log(`Cleaned corrupted record for user ${user.id}: ${user.full_name || user.stage_name}`);
        
      } catch (error) {
        console.error(`Failed to clean user ${user.id}:`, error);
        result.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Cleanup completed. Cleaned: ${result.cleaned} records`);
    return result;
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    result.errors.push(`Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};
