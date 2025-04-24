
import { fetchAllBeats, fetchTrendingBeats, fetchNewBeats, fetchRandomBeats, fetchFeaturedBeats, fetchBeatById, clearBeatsCache } from './queryService';
import { toggleFavoriteAPI, fetchUserFavorites, fetchPurchasedBeats, fetchPurchasedBeatDetails } from './userService';
import { getProducerBeats, getUserFavoriteBeats } from './filterService';

/**
 * Checks if a beat is published
 * @param status The beat status
 * @returns Boolean indicating if the beat is published
 */
export const isBeatPublished = (status: string | undefined): boolean => {
  return status === 'published';
};

export {
  fetchAllBeats,
  fetchTrendingBeats,
  fetchNewBeats,
  fetchRandomBeats,
  fetchFeaturedBeats,
  clearBeatsCache,
  fetchBeatById,
  toggleFavoriteAPI,
  fetchUserFavorites,
  fetchPurchasedBeats,
  fetchPurchasedBeatDetails,
  getProducerBeats,
  getUserFavoriteBeats
};
