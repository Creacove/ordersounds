import { supabase } from '@/integrations/supabase/client';
import { uploadImage, dataURLtoBlob } from '@/lib/imageStorage';

export interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  failedUsers: number;
  errors: string[];
}

export interface BeatMigrationResult {
  totalBeats: number;
  migratedBeats: number;
  failedBeats: number;
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
 * Migrates beat cover images from base64 to Supabase storage URLs
 * This function should be run once to clean up existing beat cover data
 */
export const migrateBeatCoverImagesToStorage = async (): Promise<BeatMigrationResult> => {
  const result: BeatMigrationResult = {
    totalBeats: 0,
    migratedBeats: 0,
    failedBeats: 0,
    errors: []
  };

  try {
    console.log('Starting migration of beat base64 cover images to storage...');
    
    // Get all beats with base64 cover images
    const { data: beats, error } = await supabase
      .from('beats')
      .select('id, cover_image, title')
      .not('cover_image', 'is', null)
      .like('cover_image', 'data:image%');

    if (error) {
      throw error;
    }

    result.totalBeats = beats?.length || 0;
    console.log(`Found ${result.totalBeats} beats with base64 cover images`);

    if (!beats || beats.length === 0) {
      console.log('No beats with base64 cover images found');
      return result;
    }

    // Process each beat
    for (const beat of beats) {
      try {
        console.log(`Processing beat ${beat.id}: ${beat.title}`);
        
        // Convert base64 to blob
        const blob = dataURLtoBlob(beat.cover_image);
        
        // Create a file from the blob
        const fileExt = beat.cover_image.split(';')[0].split('/')[1] || 'png';
        const fileName = `migrated_beat_${beat.id}.${fileExt}`;
        const file = new File([blob], fileName, { type: `image/${fileExt}` });
        
        // Upload to storage using covers bucket
        const storageUrl = await uploadImage(file, 'covers', 'migrated');
        
        // Update beat record with storage URL
        const { error: updateError } = await supabase
          .from('beats')
          .update({ cover_image: storageUrl })
          .eq('id', beat.id);
          
        if (updateError) {
          throw updateError;
        }
        
        result.migratedBeats++;
        console.log(`Successfully migrated beat ${beat.id} to ${storageUrl}`);
        
      } catch (error) {
        console.error(`Failed to migrate beat ${beat.id}:`, error);
        result.failedBeats++;
        result.errors.push(`Beat ${beat.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    console.log(`Beat migration completed. Migrated: ${result.migratedBeats}, Failed: ${result.failedBeats}`);
    return result;
    
  } catch (error) {
    console.error('Beat migration failed:', error);
    result.errors.push(`Beat migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
