
import { Beat } from '@/types';
import { CACHE_KEYS, loadFromCache, saveToCache, CACHE_DURATIONS } from './beatsCacheUtils';
import { getSortedFallbackBeats } from './beatsOptimizer';

// Default backup beats to use when nothing else is available
const DEFAULT_BACKUP_BEATS: Beat[] = [
  {
    id: "backup-1",
    title: "Demo Beat 1",
    producer_id: "system",
    producer_name: "System",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 5000,
    basic_license_price_diaspora: 15,
    genre: "Default",
    track_type: "Single",
    bpm: 100,
    tags: ["backup"],
    description: "System backup beat",
    created_at: new Date().toISOString(),
    status: "published",
    is_featured: false,
    favorites_count: 0,
    purchase_count: 0
  },
  {
    id: "backup-2",
    title: "Demo Beat 2",
    producer_id: "system",
    producer_name: "System",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 7000,
    basic_license_price_diaspora: 20,
    genre: "Default",
    track_type: "Single",
    bpm: 100,
    tags: ["backup"],
    description: "System backup beat",
    created_at: new Date().toISOString(),
    status: "published",
    is_featured: false,
    favorites_count: 0,
    purchase_count: 0
  }
];

/**
 * Get the most reliable data source depending on what's available
 */
export const getReliableBeats = (): Beat[] => {
  try {
    // First try to get beats from cache
    const cachedBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (cachedBeats && cachedBeats.length >= 2) {
      return getSortedFallbackBeats(cachedBeats);
    }
    
    // If no cached beats, try trending beats
    const trendingBeats = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
    if (trendingBeats && trendingBeats.length >= 2) {
      return trendingBeats;
    }
    
    // Last resort - use system default beats
    return DEFAULT_BACKUP_BEATS;
  } catch (error) {
    console.error('Error retrieving reliable beats data:', error);
    return DEFAULT_BACKUP_BEATS;
  }
};

/**
 * Ensure we always have some minimal data for featured content
 */
export const getReliableFeaturedBeat = (): Beat => {
  try {
    // First try to get featured beat from cache
    const cachedFeatured = loadFromCache<Beat>(CACHE_KEYS.FEATURED_BEATS);
    if (cachedFeatured) {
      return cachedFeatured;
    }
    
    // If no cached featured beat, try trending beats
    const trendingBeats = loadFromCache<Beat[]>(CACHE_KEYS.TRENDING_BEATS);
    if (trendingBeats && trendingBeats.length > 0) {
      return {...trendingBeats[0], is_featured: true};
    }
    
    // Try all beats
    const allBeats = loadFromCache<Beat[]>(CACHE_KEYS.ALL_BEATS);
    if (allBeats && allBeats.length > 0) {
      return {...allBeats[0], is_featured: true};
    }
    
    // Last resort - use first default beat as featured
    return {...DEFAULT_BACKUP_BEATS[0], is_featured: true};
  } catch (error) {
    console.error('Error retrieving reliable featured beat:', error);
    return {...DEFAULT_BACKUP_BEATS[0], is_featured: true};
  }
};

/**
 * Progressive data refresh strategy with more aggressive error handling and backoff
 */
export const progressivelyLoadData = async (
  fetchFunction: () => Promise<Beat[]>,
  maxRetries: number = 1  // Reduced from 2 to 1 to avoid excessive retries
): Promise<{ data: Beat[], fromCache: boolean, error: string | null }> => {
  let retryCount = 0;
  let error: string | null = null;
  
  // First, get reliable data from cache
  const reliableData = getReliableBeats();
  
  // Try to fetch fresh data with limited retries
  while (retryCount <= maxRetries) {
    try {
      const fetchPromise = fetchFunction();
      
      // Set a timeout for the fetch operation
      const timeoutPromise = new Promise<Beat[]>((_, reject) => {
        setTimeout(() => reject(new Error('Fetch operation timed out')), 5000); // 5 second timeout
      });
      
      // Race between fetch and timeout
      const freshData = await Promise.race([fetchPromise, timeoutPromise]);
      
      // If we got fresh data, return it and update cache
      if (freshData && freshData.length > 0) {
        saveToCache(CACHE_KEYS.ALL_BEATS, freshData, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
        return { data: freshData, fromCache: false, error: null };
      }
      
      // If no data returned, increment retry
      retryCount++;
      
      if (retryCount <= maxRetries) {
        // Wait longer between retries using exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
      }
    } catch (e) {
      console.error('Error in progressive data loading, attempt', retryCount, e);
      error = e instanceof Error ? e.message : 'Unknown error loading data';
      retryCount++;
      
      if (retryCount <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, retryCount)));
      }
    }
  }
  
  // If all fetch attempts failed, return reliable data from cache
  return { data: reliableData, fromCache: true, error };
};
