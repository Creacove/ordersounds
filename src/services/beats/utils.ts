
import { Beat } from '@/types';

/**
 * Filters beats by producer ID
 * @param beats Array of beats to filter
 * @param producerId The producer ID to filter by
 * @returns Filtered array of beats that match the producer ID
 */
export const getProducerBeats = (beats: Beat[], producerId: string): Beat[] => {
  return beats.filter(beat => beat.producer_id === producerId);
};

/**
 * Checks if a beat is published
 * @param beatId The ID of the beat to check
 * @returns Promise resolving to boolean indicating if beat is published
 */
export const isBeatPublished = async (beatId: string): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase
      .from('beats')
      .select('status')
      .eq('id', beatId)
      .eq('status', 'published')
      .maybeSingle();
      
    if (error) {
      console.error('Error checking beat published status:', error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error('Failed to check beat published status:', error);
    return false;
  }
};

/**
 * Filters beats array to only include favorites
 * @param beats Array of beats to filter
 * @param favoriteIds Array of beat IDs that are favorites
 * @returns Filtered array of favorite beats
 */
export const getUserFavoriteBeats = (beats: Beat[], favoriteIds: string[]): Beat[] => {
  if (!favoriteIds || !Array.isArray(favoriteIds) || favoriteIds.length === 0) {
    return [];
  }
  
  return beats.filter(beat => favoriteIds.includes(beat.id));
};
