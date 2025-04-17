
// Cache keys for localStorage
export const CACHE_KEYS = {
  TRENDING_BEATS: 'trending_beats_cache',
  FEATURED_BEATS: 'featured_beats_cache',
  WEEKLY_PICKS: 'weekly_picks_cache',
  ALL_BEATS: 'all_beats_cache',
  TRENDING_EXPIRY: 'trending_beats_expiry',
  FEATURED_EXPIRY: 'featured_beats_expiry',
  WEEKLY_EXPIRY: 'weekly_picks_expiry',
  ALL_BEATS_EXPIRY: 'all_beats_expiry',
  LAST_TRENDING_REFRESH: 'last_trending_refresh',
  LAST_FETCH_ATTEMPT: 'last_fetch_attempt'
};

// Cache expiration durations (in hours)
export const CACHE_DURATIONS = {
  TRENDING: 6,    // Extended from 3 to 6 hours for trending beats
  FEATURED: 12,   // Extended from 6 to 12 hours for featured beats
  WEEKLY: 168,    // Weekly (7 days * 24 hours)
  ALL_BEATS: 72,  // Extended from 48 to 72 hours for all beats
  FETCH_COOLDOWN: 1/60 // 1 minute cooldown between fetch attempts
};

// Utility function to get a cache expiration timestamp
export const getCacheExpiration = (intervalHours: number): number => {
  const date = new Date();
  date.setHours(date.getHours() + intervalHours);
  return date.getTime();
};

// Load items from local storage cache
export const loadFromCache = <T>(cacheKey: string): T | null => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      console.log(`Loading ${cacheKey} from cache`);
      return JSON.parse(cached);
    }
    return null;
  } catch (error) {
    console.error(`Error loading from cache (${cacheKey}):`, error);
    return null;
  }
};

// Save items to local storage cache
export const saveToCache = <T>(cacheKey: string, data: T, expiryKey: string, durationHours: number): void => {
  try {
    // Don't save empty arrays or null data
    if (!data || (Array.isArray(data) && data.length === 0)) {
      console.warn(`Not saving empty data to cache (${cacheKey})`);
      return;
    }

    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
    console.log(`Saved ${cacheKey} to cache, expires in ${durationHours} hours`);
    
    // Record successful fetch time
    localStorage.setItem(CACHE_KEYS.LAST_FETCH_ATTEMPT, String(Date.now()));
  } catch (error) {
    console.error(`Error saving to cache (${cacheKey}):`, error);
  }
};

// Check if cache should be refreshed
export const checkShouldRefreshCache = (expiryKey: string, defaultDurationHours: number): boolean => {
  const expiryTime = localStorage.getItem(expiryKey);
  if (!expiryTime) return true;
  
  const currentTime = new Date().getTime();
  return currentTime > parseInt(expiryTime);
};

// Check if we're online
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Check if we should attempt a new fetch based on the cooldown period
export const shouldAttemptFetch = (): boolean => {
  const lastAttempt = localStorage.getItem(CACHE_KEYS.LAST_FETCH_ATTEMPT);
  if (!lastAttempt) return true;
  
  const cooldownMs = CACHE_DURATIONS.FETCH_COOLDOWN * 60 * 60 * 1000; // Convert to ms
  const currentTime = Date.now();
  
  return (currentTime - parseInt(lastAttempt)) > cooldownMs;
};

// Record a fetch attempt regardless of outcome
export const recordFetchAttempt = (): void => {
  localStorage.setItem(CACHE_KEYS.LAST_FETCH_ATTEMPT, String(Date.now()));
};

// Optimize cache storage by limiting size
export const optimizeCacheStorage = (maxBeats: number = 30): void => {
  try {
    const allBeatsString = localStorage.getItem(CACHE_KEYS.ALL_BEATS);
    if (allBeatsString) {
      const allBeats = JSON.parse(allBeatsString);
      if (Array.isArray(allBeats) && allBeats.length > maxBeats) {
        // Keep only the most popular beats in cache
        const optimizedBeats = allBeats
          .sort((a, b) => ((b.purchase_count || 0) + (b.favorites_count || 0)) - 
                          ((a.purchase_count || 0) + (a.favorites_count || 0)))
          .slice(0, maxBeats);
        
        localStorage.setItem(CACHE_KEYS.ALL_BEATS, JSON.stringify(optimizedBeats));
        console.log(`Optimized beats cache: reduced from ${allBeats.length} to ${optimizedBeats.length} items`);
      }
    }
  } catch (error) {
    console.error('Error optimizing cache storage:', error);
  }
};

// Deep clean cache to prevent storage issues
export const deepCleanCache = (): void => {
  try {
    // Clear unused or potentially corrupted cache items
    const keysToKeep = [
      CACHE_KEYS.ALL_BEATS,
      CACHE_KEYS.ALL_BEATS_EXPIRY,
      CACHE_KEYS.TRENDING_BEATS,
      CACHE_KEYS.TRENDING_EXPIRY
    ];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('_cache') && !keysToKeep.includes(key)) {
        localStorage.removeItem(key);
        console.log(`Removed potentially stale cache item: ${key}`);
      }
    }
    
    // Ensure cache size is optimal
    optimizeCacheStorage(30);
  } catch (error) {
    console.error('Error in deepCleanCache:', error);
  }
};
