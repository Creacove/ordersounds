
import { Beat } from '@/types';

/**
 * Get beats by producer ID
 * @param beats Array of beats to filter
 * @param producerId Producer ID to filter by
 * @returns Array of beats from the specified producer
 */
export const getProducerBeats = (beats: Beat[], producerId: string): Beat[] => {
  if (!beats || beats.length === 0) return [];
  return beats.filter(beat => beat.producer_id === producerId);
};

/**
 * Get user's favorite beats
 * @param beats Array of beats to filter
 * @param favoriteIds Array of beat IDs that are favorites
 * @returns Array of beats that are favorites
 */
export const getUserFavoriteBeats = (beats: Beat[], favoriteIds: string[]): Beat[] => {
  if (!beats || beats.length === 0 || !favoriteIds || favoriteIds.length === 0) return [];
  return beats.filter(beat => favoriteIds.includes(beat.id));
};
