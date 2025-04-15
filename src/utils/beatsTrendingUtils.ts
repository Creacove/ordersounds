
import { Beat } from '@/types';
import { saveToCache } from './beatsCacheUtils';
import { CACHE_KEYS, CACHE_DURATIONS } from './beatsCacheUtils';
import { fallbackBeats } from '@/services/beatsService';

// Function to refresh trending beats with cache updates
export const refreshTrendingBeats = (allBeats: Beat[]): Beat[] => {
  console.log('Refreshing trending beats - hourly refresh');
  
  if (allBeats.length === 0) {
    return fallbackBeats;
  }
  
  // Completely randomize the order of beats to maximize variety
  const shuffled = [...allBeats].sort(() => Math.random() - 0.5);
  
  // Create a scoring system that considers multiple factors with high randomization
  const sortedByTrending = shuffled.sort((a, b) => {
    // Create a unique random seed for each beat to ensure different ordering each time
    const randomFactorA = 0.5 + Math.random(); // 0.5 to 1.5
    const randomFactorB = 0.5 + Math.random(); // 0.5 to 1.5
    
    // Use multiple factors with high randomness to ensure varied ordering
    const scoreA = (
      (b.favorites_count * randomFactorA) + 
      (b.purchase_count * 2 * randomFactorB) + 
      (Math.random() * 10) // Add significant random component
    );
    
    const scoreB = (
      (a.favorites_count * randomFactorA) + 
      (a.purchase_count * 2 * randomFactorB) + 
      (Math.random() * 10) // Add significant random component
    );
    
    return scoreA - scoreB;
  });
  
  // Get trending beats - limiting to 30
  const trending = sortedByTrending.slice(0, 30);
  
  // Update cache with timestamp
  saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
  localStorage.setItem(CACHE_KEYS.LAST_TRENDING_REFRESH, new Date().toISOString());
  
  return trending;
};

// Function to refresh weekly picks with cache updates
export const refreshWeeklyPicks = (allBeats: Beat[]): Beat[] => {
  if (allBeats.length === 0) {
    return fallbackBeats;
  }
  
  // For weekly picks, select based on a combination of factors
  const shuffled = [...allBeats].sort(() => 0.5 - Math.random());
  // Select beats that have good engagement but aren't necessarily the top ones
  const picks = shuffled
    .filter(beat => beat.favorites_count > 0 || beat.purchase_count > 0)
    .slice(0, 8);
  
  // If we don't have enough beats with engagement, just use some random ones
  if (picks.length < 6) {
    saveToCache(CACHE_KEYS.WEEKLY_PICKS, shuffled.slice(0, 8), CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
    return shuffled.slice(0, 8);
  } else {
    saveToCache(CACHE_KEYS.WEEKLY_PICKS, picks, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
    return picks;
  }
};

// Function to select a featured beat
export const selectFeaturedBeat = (beats: Beat[]): Beat => {
  if (beats.length === 0) {
    return fallbackBeats[0];
  }
  
  // Process trending beats first for featured selection
  const shuffled = [...beats].sort(() => 0.5 - Math.random());
  // Then sort by favorites count with a small random factor
  const sortedByTrending = shuffled
    .sort((a, b) => (b.favorites_count * (0.9 + Math.random() * 0.2)) - 
                  (a.favorites_count * (0.9 + Math.random() * 0.2)));
                  
  // Randomly select a featured beat from top trending
  const randomIndex = Math.floor(Math.random() * Math.min(10, sortedByTrending.length));
  const featured = sortedByTrending[randomIndex];
  const featuredBeat = {...featured, is_featured: true};
  
  saveToCache(CACHE_KEYS.FEATURED_BEATS, featuredBeat, CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
  
  return featuredBeat;
};
