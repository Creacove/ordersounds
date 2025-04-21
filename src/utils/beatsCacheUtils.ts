
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
  USER_PURCHASES: 'user_purchases_cache',
  LAST_FETCH_TIMESTAMP: 'last_fetch_timestamp'
};

// Cache expiration durations (in hours) - Further increased to dramatically reduce API calls
export const CACHE_DURATIONS = {
  TRENDING: 24,     // Increased from 12 hours to 24 hours for trending beats
  FEATURED: 48,     // Increased from 24 hours to 48 hours for featured beats
  WEEKLY: 168,      // Weekly (7 days * 24 hours)
  ALL_BEATS: 168,   // Increased from 96 hours to 168 hours (7 days) for all beats
  PRODUCERS: 72,    // Increased from 48 hours to 72 hours for producers list
  PLAYLISTS: 48     // Increased from 24 hours to 48 hours for playlists
};

// Network timeouts (in milliseconds) - Greatly increased for reliability
export const NETWORK_TIMEOUTS = {
  STANDARD: 45000,  // Increased from 30 seconds to 45 seconds
  SHORT: 30000,     // Increased from 15 seconds to 30 seconds
  LONG: 60000       // Maintained 60 seconds for initial app load
};

// Utility function to get a cache expiration timestamp
export const getCacheExpiration = (intervalHours: number): number => {
  const date = new Date();
  date.setHours(date.getHours() + intervalHours);
  return date.getTime();
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
    
    // Check if we're approaching storage limits
    const estimatedSize = jsonData.length * 2; // Rough estimate in bytes
    if (estimatedSize > 4 * 1024 * 1024) { // 4MB
      console.warn(`Cache data for ${cacheKey} is very large (${Math.round(estimatedSize/1024/1024)}MB), might hit storage limits`);
      
      // If too large, try to clear old caches
      try {
        clearOldCaches();
      } catch (e) {
        console.error("Error clearing old caches:", e);
      }
    }
    
    // Try to save the data
    try {
      localStorage.setItem(cacheKey, jsonData);
      localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
      console.log(`Saved ${cacheKey} to cache, expires in ${durationHours} hours`);
      
      // Also save the timestamp of when we last fetched data
      localStorage.setItem(CACHE_KEYS.LAST_FETCH_TIMESTAMP, String(Date.now()));
      
      return true;
    } catch (storageError) {
      // If we hit quota limits, try to free up space and try again
      console.error(`Storage error for ${cacheKey}:`, storageError);
      emergencyCacheClear();
      
      // Try again after clearing
      try {
        localStorage.setItem(cacheKey, jsonData);
        localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
        console.log(`Saved ${cacheKey} to cache after emergency clear, expires in ${durationHours} hours`);
        return true;
      } catch (secondError) {
        console.error(`Failed to save ${cacheKey} even after clearing cache:`, secondError);
        return false;
      }
    }
  } catch (error) {
    console.error(`Error saving to cache (${cacheKey}):`, error);
    return false;
  }
};

// Clear old and less important caches when approaching storage limits
const clearOldCaches = (): void => {
  // Find caches that are expired or less critical
  const lowPriorityCaches = [
    { key: CACHE_KEYS.TRENDING_BEATS, expiry: CACHE_KEYS.TRENDING_EXPIRY },
    { key: CACHE_KEYS.WEEKLY_PICKS, expiry: CACHE_KEYS.WEEKLY_EXPIRY },
    { key: CACHE_KEYS.PLAYLISTS, expiry: CACHE_KEYS.PLAYLISTS_EXPIRY }
  ];
  
  for (const cache of lowPriorityCaches) {
    if (checkShouldRefreshCache(cache.expiry, 0)) {
      // Cache is expired, clear it
      localStorage.removeItem(cache.key);
      localStorage.removeItem(cache.expiry);
      console.log(`Cleared expired cache: ${cache.key}`);
    }
  }
};

// Emergency cache clearing when we hit storage limits
const emergencyCacheClear = (): void => {
  console.warn("Emergency cache clearing triggered due to storage limits");
  
  // Keep only the most essential caches
  const keysToKeep = [
    CACHE_KEYS.ALL_BEATS,
    CACHE_KEYS.ALL_BEATS_EXPIRY,
    CACHE_KEYS.USER_FAVORITES,
    CACHE_KEYS.USER_PURCHASES,
    'supabase_connection_status',
    'auth.access_token',
    'auth.refresh_token',
  ];
  
  // Clear everything except what we want to keep
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
  
  console.log("Emergency cache clear completed");
};

// Check if cache should be refreshed - now with a forced minimum interval
export const checkShouldRefreshCache = (expiryKey: string, defaultDurationHours: number): boolean => {
  const expiryTime = localStorage.getItem(expiryKey);
  if (!expiryTime) return true;
  
  const currentTime = new Date().getTime();
  const shouldRefresh = currentTime > parseInt(expiryTime);
  
  // If we're asking to refresh, also check if we've made a request recently
  if (shouldRefresh) {
    // Get the last fetch timestamp
    const lastFetchStr = localStorage.getItem(CACHE_KEYS.LAST_FETCH_TIMESTAMP);
    if (lastFetchStr) {
      const lastFetch = parseInt(lastFetchStr);
      const timeSinceLastFetch = currentTime - lastFetch;
      
      // If we've made a request in the last 30 minutes, don't make another one
      const minimumFetchInterval = 30 * 60 * 1000; // 30 minutes
      if (timeSinceLastFetch < minimumFetchInterval) {
        console.log(`Not refreshing ${expiryKey} - too soon since last fetch (${Math.round(timeSinceLastFetch/1000/60)} minutes ago)`);
        return false;
      }
    }
  }
  
  return shouldRefresh;
};

// Check if we're online with improved detection
export const isOnline = (): boolean => {
  // Check navigator.onLine as base condition
  const navigatorOnline = navigator.onLine;
  
  // Get cached connection status as backup
  const cachedStatus = localStorage.getItem('supabase_connection_status');
  
  // If navigator says we're offline, trust it
  if (!navigatorOnline) return false;
  
  // If navigator says online but we have a cached failed status from the last 15 minutes, use that
  const lastCheckTimeStr = localStorage.getItem('last_connection_check');
  if (cachedStatus === 'disconnected' && lastCheckTimeStr) {
    const lastCheck = parseInt(lastCheckTimeStr);
    const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000); // increased from 2 minutes to 15 minutes
    if (lastCheck > fifteenMinutesAgo) {
      return false;
    }
  }
  
  // Default to navigator status
  return navigatorOnline;
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
      return NETWORK_TIMEOUTS.SHORT;
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
  const warningThreshold = 4 * 1024 * 1024; // 4MB
  return totalSize > warningThreshold;
};

// Get data freshness status
export const getDataFreshnessStatus = (): 'fresh' | 'stale' | 'expired' => {
  const allBeatsExpiry = localStorage.getItem(CACHE_KEYS.ALL_BEATS_EXPIRY);
  
  if (!allBeatsExpiry) return 'expired';
  
  const expiryTime = parseInt(allBeatsExpiry);
  const currentTime = Date.now();
  const timeUntilExpiry = expiryTime - currentTime;
  
  // If within 24 hours of expiry, consider it stale
  if (timeUntilExpiry <= 24 * 60 * 60 * 1000) {
    return 'stale';
  }
  
  return 'fresh';
};

// NEW: Check if we should force a fresh fetch based on app launch
export const shouldForceFreshFetchOnLaunch = (): boolean => {
  // Get the last fetch timestamp
  const lastFetchStr = localStorage.getItem(CACHE_KEYS.LAST_FETCH_TIMESTAMP);
  
  if (!lastFetchStr) {
    // If we've never fetched, definitely fetch
    return true;
  }
  
  const lastFetch = parseInt(lastFetchStr);
  const currentTime = Date.now();
  const hoursSinceLastFetch = (currentTime - lastFetch) / (1000 * 60 * 60);
  
  // If it's been more than 24 hours since our last fetch, do a fresh fetch
  return hoursSinceLastFetch > 24;
};
