
export * from './types';
export * from './utils';
export * from './queryService';
export * from './userService';

// Helper functions that don't need database access
export const getProducerBeats = (beats: Beat[], producerId: string): Beat[] => {
  return beats.filter(beat => beat.producer_id === producerId);
};

export const getUserFavoriteBeats = (beats: Beat[], favoriteIds: string[]): Beat[] => {
  return beats.filter(beat => favoriteIds.includes(beat.id));
};
