
import { Beat } from '@/types';
import { saveToCache } from './beatsCacheUtils';
import { CACHE_KEYS, CACHE_DURATIONS } from './beatsCacheUtils';

// Function to refresh trending beats with cache updates
export const refreshTrendingBeats = (allBeats: Beat[]): Beat[] => {
  console.log('Refreshing trending beats - hourly refresh');

  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  // Take only a subset of beats for trending to reduce memory footprint
  const maxBeatsForTrending = 100;
  const beatsForTrending = allBeats.length > maxBeatsForTrending ? 
    allBeats.slice(0, maxBeatsForTrending) : 
    [...allBeats];

  // Completely randomize the order of beats to maximize variety
  const shuffled = beatsForTrending.sort(() => Math.random() - 0.5);

  // Sort by engagement + randomness for trending
  const sortedByTrending = shuffled.sort((a, b) => {
    const randomFactorA = 0.5 + Math.random();
    const randomFactorB = 0.5 + Math.random();

    const scoreA = (
      (a.favorites_count * randomFactorA) +
      (a.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    const scoreB = (
      (b.favorites_count * randomFactorA) +
      (b.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    return scoreB - scoreA;
  });

  // Limit to 30 trending beats max to avoid quota issues
  const trending = sortedByTrending.slice(0, 30);

  try {
    saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
  } catch (e) {
    console.error('Failed to save trending beats to cache:', e);
    // Continue even if cache save fails
  }
  
  localStorage.setItem(CACHE_KEYS.LAST_TRENDING_REFRESH, new Date().toISOString());

  return trending;
};

export const refreshWeeklyPicks = (allBeats: Beat[]): Beat[] => {
  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  // Take only a subset of beats for picks to reduce memory footprint
  const maxBeatsForPicks = 50;
  const beatsForPicks = allBeats.length > maxBeatsForPicks ? 
    allBeats.slice(0, maxBeatsForPicks) : 
    [...allBeats];

  const shuffled = beatsForPicks.sort(() => 0.5 - Math.random());
  
  // Limit to 8 weekly picks max to avoid quota issues
  const picks = shuffled.slice(0, 8);
  
  try {
    saveToCache(CACHE_KEYS.WEEKLY_PICKS, picks, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
  } catch (e) {
    console.error('Failed to save weekly picks to cache:', e);
    // Continue even if cache save fails
  }
  
  return picks;
};

export const selectFeaturedBeat = (beats: Beat[]): Beat | null => {
  if (!beats || beats.length === 0) {
    return null;
  }

  // Take only a subset of beats for featured selection to reduce memory footprint
  const maxBeatsForFeatured = 20;
  const beatsForFeatured = beats.length > maxBeatsForFeatured ? 
    beats.slice(0, maxBeatsForFeatured) : 
    [...beats];

  const shuffled = beatsForFeatured.sort(() => 0.5 - Math.random());
  const randomIndex = Math.floor(Math.random() * Math.min(10, shuffled.length));
  const featured = shuffled[randomIndex];
  return featured ? { ...featured, is_featured: true } : null;
};
