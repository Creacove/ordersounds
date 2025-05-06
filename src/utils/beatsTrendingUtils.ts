
import { Beat } from '@/types';
import { saveToCache } from './beatsCacheUtils';
import { CACHE_KEYS, CACHE_DURATIONS } from './beatsCacheUtils';

// Create a lightweight beat object for caching to reduce storage size
const createLightweightBeatForCache = (beat: Beat): Partial<Beat> => {
  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: beat.producer_name,
    cover_image_url: beat.cover_image_url,
    preview_url: beat.preview_url,
    genre: beat.genre,
    bpm: beat.bpm,
    favorites_count: beat.favorites_count,
    purchase_count: beat.purchase_count,
    basic_license_price_local: beat.basic_license_price_local,
    basic_license_price_diaspora: beat.basic_license_price_diaspora,
    // Omit large fields and less essential data
  };
};

// Function to refresh trending beats with cache updates - limit to fewer beats to save storage
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

  // Reduce from 30 to 15 to save storage space
  const trending = sortedByTrending.slice(0, 15);
  
  // Create lightweight versions for cache storage
  const lightweightTrending = trending.map(createLightweightBeatForCache);

  try {
    saveToCache(CACHE_KEYS.TRENDING_BEATS, lightweightTrending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
    localStorage.setItem(CACHE_KEYS.LAST_TRENDING_REFRESH, new Date().toISOString());
  } catch (error) {
    console.error("Failed to save trending beats to cache:", error);
    // Continue without caching if localStorage fails
  }

  return trending;
};

export const refreshWeeklyPicks = (allBeats: Beat[]): Beat[] => {
  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  const shuffled = [...allBeats].sort(() => 0.5 - Math.random());
  // Reduced from 8 to 6 to save storage
  const picks = shuffled.slice(0, 6);
  
  // Create lightweight versions for cache storage
  const lightweightPicks = picks.map(createLightweightBeatForCache);
  
  try {
    saveToCache(CACHE_KEYS.WEEKLY_PICKS, lightweightPicks, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
  } catch (error) {
    console.error("Failed to save weekly picks to cache:", error);
    // Continue without caching if localStorage fails
  }
  
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
