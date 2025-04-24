
import { Beat } from '@/types';
import { saveToCache } from './beatsCacheUtils';
import { CACHE_KEYS, CACHE_DURATIONS } from './beatsCacheUtils';

// Function to refresh trending beats with cache updates
export const refreshTrendingBeats = (allBeats: Beat[]): Beat[] => {
  console.log('Refreshing trending beats - hourly refresh');

  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  // Completely randomize the order of beats to maximize variety
  const shuffled = [...allBeats].sort(() => Math.random() - 0.5);

  // Sort by engagement + randomness for trending
  const sortedByTrending = shuffled.sort((a, b) => {
    const randomFactorA = 0.5 + Math.random();
    const randomFactorB = 0.5 + Math.random();

    const scoreA = (
      (b.favorites_count * randomFactorA) +
      (b.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    const scoreB = (
      (a.favorites_count * randomFactorA) +
      (a.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    return scoreA - scoreB;
  });

  const trending = sortedByTrending.slice(0, 30);

  saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
  localStorage.setItem(CACHE_KEYS.LAST_TRENDING_REFRESH, new Date().toISOString());

  return trending;
};

export const refreshWeeklyPicks = (allBeats: Beat[]): Beat[] => {
  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  const shuffled = [...allBeats].sort(() => 0.5 - Math.random());
  const picks = shuffled.slice(0, 8);
  
  saveToCache(CACHE_KEYS.WEEKLY_PICKS, picks, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
  return picks;
};

export const selectFeaturedBeat = (beats: Beat[]): Beat | null => {
  if (!beats || beats.length === 0) {
    return null;
  }

  const shuffled = [...beats].sort(() => 0.5 - Math.random());
  const randomIndex = Math.floor(Math.random() * Math.min(10, shuffled.length));
  const featured = shuffled[randomIndex];
  return featured ? { ...featured, is_featured: true } : null;
};
