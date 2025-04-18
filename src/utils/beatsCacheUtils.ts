
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
  NETWORK_CONDITIONS: 'network_conditions'
};

// Cache expiration durations (in hours)
export const CACHE_DURATIONS = {
  TRENDING: 6,     // Increased from 1 hour to 6 hours for trending beats
  FEATURED: 12,    // Increased from 3 hours to 12 hours for featured beats
  WEEKLY: 168,     // Weekly (7 days * 24 hours)
  ALL_BEATS: 72    // Increased from 24 hours to 72 hours for all beats
};

// Network timeouts (in milliseconds)
export const NETWORK_TIMEOUTS = {
  STANDARD: 60000,  // 60 seconds for standard requests
  SHORT: 30000,     // 30 seconds for less critical data
  LONG: 120000      // 2 minutes for initial app load
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
    localStorage.setItem(cacheKey, JSON.stringify(data));
    localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
    console.log(`Saved ${cacheKey} to cache, expires in ${durationHours} hours`);
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

// Get appropriate timeout based on network conditions
export const getNetworkTimeout = (): number => {
  try {
    // Check if we have stored information about network conditions
    const networkConditions = localStorage.getItem(CACHE_KEYS.NETWORK_CONDITIONS);
    
    if (networkConditions === 'slow') {
      return NETWORK_TIMEOUTS.LONG;
    } else if (networkConditions === 'medium') {
      return NETWORK_TIMEOUTS.STANDARD;
    } else {
      return NETWORK_TIMEOUTS.STANDARD; // Default to standard timeout
    }
  } catch {
    return NETWORK_TIMEOUTS.STANDARD;
  }
};

// Update network conditions based on response time
export const updateNetworkConditions = (responseTimeMs: number): void => {
  try {
    // Categorize network speed based on response time
    let networkCondition;
    if (responseTimeMs > 5000) {
      networkCondition = 'slow';
    } else if (responseTimeMs > 2000) {
      networkCondition = 'medium';
    } else {
      networkCondition = 'fast';
    }
    
    localStorage.setItem(CACHE_KEYS.NETWORK_CONDITIONS, networkCondition);
  } catch (error) {
    console.error('Error updating network conditions:', error);
  }
};
