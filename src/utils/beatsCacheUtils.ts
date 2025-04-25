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
  NETWORK_CONDITIONS: 'network_conditions',
  PRODUCERS: 'producers_cache',
  PRODUCERS_EXPIRY: 'producers_expiry',
  PLAYLISTS: 'playlists_cache',
  PLAYLISTS_EXPIRY: 'playlists_expiry',
  USER_FAVORITES: 'user_favorites_cache',
  USER_PURCHASES: 'user_purchases_cache'
};

// Cache expiration durations (in hours) - Significantly increased to reduce API calls
export const CACHE_DURATIONS = {
  TRENDING: 24,     // Increased to 24 hours for trending beats
  FEATURED: 48,     // Increased to 48 hours for featured beats
  WEEKLY: 168,      // Weekly (7 days * 24 hours)
  ALL_BEATS: 120,   // Increased to 120 hours (5 days) for all beats
  PRODUCERS: 72,    // Increased to 72 hours (3 days) for producers
  PLAYLISTS: 48     // Increased to 48 hours (2 days) for playlists
};

// Network timeouts (in milliseconds)
export const NETWORK_TIMEOUTS = {
  STANDARD: 30000,  // 30 seconds standard timeout
  SHORT: 20000,     // 20 seconds for less critical data
  LONG: 60000       // 60 seconds for initial app load
};

// Utility function to get a cache expiration timestamp
export const getCacheExpiration = (intervalHours: number): number => {
  const date = new Date();
  date.setHours(date.getHours() + intervalHours);
  return date.getTime();
};

// Size limits for different caches in bytes (approximately)
const CACHE_SIZE_LIMITS = {
  TRENDING_BEATS: 1 * 1024 * 1024, // 1MB for trending beats
  WEEKLY_PICKS: 500 * 1024,        // 500KB for weekly picks
  FEATURED_BEATS: 200 * 1024,      // 200KB for featured beats
  ALL_BEATS: 2 * 1024 * 1024,      // 2MB for all beats
  USER_CARTS: 100 * 1024           // 100KB for user carts
};

// Improved load from cache with data validation
export const loadFromCache = <T>(cacheKey: string): T | null => {
  try {
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;
    
    // Check if the cached data is valid JSON
    try {
      const data = JSON.parse(cached);
      
      // Basic validation - check if it's an object or array
      if (data && (typeof data === 'object' || Array.isArray(data))) {
        console.log(`Loading ${cacheKey} from cache`);
        return data as T;
      }
      
      // Invalid data structure, clear it
      localStorage.removeItem(cacheKey);
      return null;
    } catch (parseError) {
      // Invalid JSON, clear it
      console.error(`Invalid cache data for ${cacheKey}:`, parseError);
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (error) {
    console.error(`Error loading from cache (${cacheKey}):`, error);
    return null;
  }
};

// Check if an item will exceed size limits before saving
const willExceedSizeLimit = (key: string, data: string): boolean => {
  let limit = 1 * 1024 * 1024; // Default 1MB limit
  
  if (key.includes('trending')) {
    limit = CACHE_SIZE_LIMITS.TRENDING_BEATS;
  } else if (key.includes('weekly')) {
    limit = CACHE_SIZE_LIMITS.WEEKLY_PICKS;
  } else if (key.includes('featured')) {
    limit = CACHE_SIZE_LIMITS.FEATURED_BEATS;
  } else if (key.includes('all_beats')) {
    limit = CACHE_SIZE_LIMITS.ALL_BEATS;
  } else if (key.includes('cart_')) {
    limit = CACHE_SIZE_LIMITS.USER_CARTS;
  }
  
  return data.length * 2 > limit; // Rough estimate of byte size in UTF-16
};

// Enhanced save to cache with storage quota management
export const saveToCache = <T>(cacheKey: string, data: T, expiryKey: string, durationHours: number): boolean => {
  try {
    // Check if data is valid before saving
    if (data === null || data === undefined) {
      console.warn(`Not caching ${cacheKey} - data is null or undefined`);
      return false;
    }
    
    // Convert data to JSON string
    const jsonData = JSON.stringify(data);
    
    // Check if we're approaching storage limits with this specific item
    if (willExceedSizeLimit(cacheKey, jsonData)) {
      console.warn(`Cache data for ${cacheKey} is too large, cannot be saved`);
      return false;
    }
    
    // Try to save the data with error handling
    try {
      localStorage.setItem(cacheKey, jsonData);
      localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
      console.log(`Saved ${cacheKey} to cache, expires in ${durationHours} hours`);
      return true;
    } catch (storageError) {
      // If we hit quota limits, try to free up space and try again
      console.error(`Storage error for ${cacheKey}:`, storageError);
      emergencyCacheClear();
      
      // Try again after clearing but skip if it's one of the large caches
      if (!cacheKey.includes('trending') && !cacheKey.includes('all_beats')) {
        try {
          localStorage.setItem(cacheKey, jsonData);
          localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
          console.log(`Saved ${cacheKey} to cache after emergency clear, expires in ${durationHours} hours`);
          return true;
        } catch (secondError) {
          console.error(`Failed to save ${cacheKey} even after clearing cache:`, secondError);
          return false;
        }
      } else {
        // Skip saving large data after emergency clear to avoid filling up again
        console.log(`Skipped saving ${cacheKey} after emergency clear to preserve space`);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error saving to cache (${cacheKey}):`, error);
    return false;
  }
};

// More aggressive clearing of old caches when approaching storage limits
const clearOldCaches = (): void => {
  // Find caches that are expired or less critical
  const lowPriorityCaches = [
    { key: CACHE_KEYS.TRENDING_BEATS, expiry: CACHE_KEYS.TRENDING_EXPIRY },
    { key: CACHE_KEYS.WEEKLY_PICKS, expiry: CACHE_KEYS.WEEKLY_EXPIRY },
    { key: CACHE_KEYS.PLAYLISTS, expiry: CACHE_KEYS.PLAYLISTS_EXPIRY },
    { key: CACHE_KEYS.PRODUCERS, expiry: CACHE_KEYS.PRODUCERS_EXPIRY }
  ];
  
  for (const cache of lowPriorityCaches) {
    if (checkShouldRefreshCache(cache.expiry, 0)) {
      // Cache is expired, clear it
      localStorage.removeItem(cache.key);
      localStorage.removeItem(cache.expiry);
      console.log(`Cleared expired cache: ${cache.key}`);
    }
  }
  
  // Always clear non-essential metadata to free up space
  const metadataKeys = [
    'network_response_times',
    'last_trending_refresh',
    'supabase_connection_status'
  ];
  
  for (const key of metadataKeys) {
    localStorage.removeItem(key);
  }
};

// More selective emergency cache clearing - prioritize keeping user-specific data
const emergencyCacheClear = (): void => {
  console.warn("Emergency cache clearing triggered due to storage limits");
  
  // First try clearing just the large caches
  const largeCachesToRemove = [
    CACHE_KEYS.TRENDING_BEATS,
    CACHE_KEYS.ALL_BEATS,
    CACHE_KEYS.FEATURED_BEATS,
    CACHE_KEYS.WEEKLY_PICKS,
    CACHE_KEYS.TRENDING_EXPIRY,
    CACHE_KEYS.ALL_BEATS_EXPIRY,
    CACHE_KEYS.FEATURED_EXPIRY,
    CACHE_KEYS.WEEKLY_EXPIRY
  ];
  
  for (const key of largeCachesToRemove) {
    localStorage.removeItem(key);
  }
  
  // Then clear any other non-essential items if needed
  if (isStorageLimitApproaching()) {
    const keysToKeep = [
      CACHE_KEYS.USER_FAVORITES,
      CACHE_KEYS.USER_PURCHASES,
      'auth.access_token',
      'auth.refresh_token',
    ];
    
    // Clear everything except what we want to keep
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !keysToKeep.includes(key) && !key.startsWith('cart_')) {
        localStorage.removeItem(key);
      }
    }
  }
  
  console.log("Emergency cache clear completed");
};

// Check if cache should be refreshed
export const checkShouldRefreshCache = (expiryKey: string, defaultDurationHours: number): boolean => {
  const expiryTime = localStorage.getItem(expiryKey);
  if (!expiryTime) return true;
  
  const currentTime = new Date().getTime();
  return currentTime > parseInt(expiryTime);
};

// Check if we're online with improved detection
export const isOnline = (): boolean => {
  // Check navigator.onLine as base condition
  return navigator.onLine;
};

// Get appropriate timeout based on network conditions
export const getNetworkTimeout = (): number => {
  return NETWORK_TIMEOUTS.STANDARD; // Use a standard 30s timeout for all requests
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

// Calculate cache size to monitor usage
export const calculateCacheSize = (): number => {
  let totalSize = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) || '';
        totalSize += key.length + value.length;
      }
    }
    
    return totalSize;
  } catch (error) {
    console.error('Error calculating cache size:', error);
    return 0;
  }
};

// Check if we're approaching storage limits
export const isStorageLimitApproaching = (): boolean => {
  const totalSize = calculateCacheSize();
  // Most browsers have a 5MB limit (5 * 1024 * 1024)
  const warningThreshold = 3.5 * 1024 * 1024; // 3.5MB - more conservative
  return totalSize > warningThreshold;
};
