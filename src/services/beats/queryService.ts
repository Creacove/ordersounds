import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';

// Helper to get the basic beats query fields
const BEAT_QUERY_FIELDS = `
  id,
  title,
  producer_id,
  users (
    full_name,
    stage_name
  ),
  cover_image,
  audio_preview,
  basic_license_price_local,
  basic_license_price_diaspora,
  genre,
  track_type,
  bpm,
  tags,
  upload_date,
  favorites_count,
  purchase_count,
  status,
  is_trending,
  is_weekly_pick,
  is_featured
`;

// Add request cache to prevent duplicate requests in the same session
const requestCache = new Map<string, { data: Beat[], timestamp: number }>();

// Maximum age for cached results in milliseconds (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000; 

// Function to check if cache is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < MAX_CACHE_AGE;
}

// Global pending requests map - moved outside function to persist between calls
const pendingRequests = new Map<string, Promise<Beat[]>>();

// Exponential backoff settings
const BACKOFF_SETTINGS = {
  initialDelay: 300,
  maxDelay: 10000,
  maxRetries: 3
};

// Get backoff delay based on retry count
const getBackoffDelay = (retryCount: number): number => {
  return Math.min(
    BACKOFF_SETTINGS.initialDelay * Math.pow(2, retryCount),
    BACKOFF_SETTINGS.maxDelay
  );
};

export const fetchAllBeats = async (options: { 
  includeDetails?: boolean; 
  limit?: number; 
  includeDrafts?: boolean;
  producerId?: string;
  skipCache?: boolean;
  retryCount?: number;
} = {}): Promise<Beat[]> => {
  try {
    const { 
      includeDrafts = false,
      producerId,
      skipCache = false,
      limit = 0
    } = options;
    
    let query = supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS);
    
    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }
    
    if (producerId) {
      query = query.eq('producer_id', producerId);
    }
    
    if (limit > 0) {
      query = query.limit(limit);
    }

    const { data: beatsData, error: beatsError } = await query;
    
    if (beatsError) throw beatsError;
    
    if (beatsData && beatsData.length > 0) {
      return beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error in fetchAllBeats:', error);
    return [];
  }
};

// Global pending requests maps for other endpoints
const trendingPendingRequests = new Map<string, Promise<Beat[]>>();
const newBeatsPendingRequests = new Map<string, Promise<Beat[]>>();
const randomBeatsPendingRequests = new Map<string, Promise<Beat[]>>();
const beatDetailPendingRequests = new Map<string, Promise<Beat | null>>();
const featuredBeatsPendingRequests = new Map<string, Promise<Beat[]>>();

// Cache for trending beats (memory only, cleared when page refreshes)
const trendingCache = new Map<number, Beat[]>();

export const fetchTrendingBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .order('favorites_count', { ascending: false })
      .order('purchase_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

// Cache for new beats
const newBeatsCache = new Map<string, Beat[]>();

export const fetchNewBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    // Create a cache key based on the limit
    const cacheKey = `new-beats-${limit}`;
    
    // Check cache first
    if (newBeatsCache.has(cacheKey)) {
      return newBeatsCache.get(cacheKey) || [];
    }
    
    if (newBeatsPendingRequests.has(cacheKey)) {
      console.log('Duplicate new beats request prevented');
      return newBeatsPendingRequests.get(cacheKey) as Promise<Beat[]>;
    }
    
    const requestPromise = Promise.resolve(supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        newBeatsPendingRequests.delete(cacheKey);
        
        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache with specific limit key
        newBeatsCache.set(cacheKey, mappedBeats);
        
        return mappedBeats;
      })
      .catch(error => {
        newBeatsPendingRequests.delete(cacheKey);
        console.error('Error fetching new beats:', error);
        return [];
      }));
    
    newBeatsPendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return [];
  }
};

// Cache for random beats
const randomBeatsCache = new Map<number, Beat[]>();

export const fetchRandomBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    // Check cache first - note that random beats should perhaps not be cached too long
    // as the randomness aspect is part of the feature
    if (randomBeatsCache.has(limit)) {
      return randomBeatsCache.get(limit) || [];
    }
    
    const requestKey = `random-beats-${limit}`;
    if (randomBeatsPendingRequests.has(requestKey)) {
      console.log('Duplicate random beats request prevented');
      return randomBeatsPendingRequests.get(requestKey) as Promise<Beat[]>;
    }
    
    const requestPromise = Promise.resolve(supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .limit(limit)
      .then(({ data, error }) => {
        randomBeatsPendingRequests.delete(requestKey);
        
        if (error) throw error;

        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          const mappedBeats = shuffled.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
          
          // Store in cache
          randomBeatsCache.set(limit, mappedBeats);
          
          return mappedBeats;
        }
        
        return [];
      })
      .catch(error => {
        randomBeatsPendingRequests.delete(requestKey);
        console.error('Error fetching random beats:', error);
        return [];
      }));
    
    randomBeatsPendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching random beats:', error);
    return [];
  }
};

// Cache for individual beats
const beatCache = new Map<string, Beat | null>();

export const fetchBeatById = async (beatId: string): Promise<Beat | null> => {
  try {
    // Check cache first
    if (beatCache.has(beatId)) {
      return beatCache.get(beatId) || null;
    }
    
    if (beatDetailPendingRequests.has(beatId)) {
      console.log('Duplicate beat detail request prevented');
      return beatDetailPendingRequests.get(beatId) as Promise<Beat | null>;
    }
    
    const requestPromise = Promise.resolve(supabase
      .from('beats')
      .select(`
        ${BEAT_QUERY_FIELDS},
        audio_file,
        premium_license_price_local,
        premium_license_price_diaspora,
        exclusive_license_price_local,
        exclusive_license_price_diaspora,
        custom_license_price_local,
        custom_license_price_diaspora,
        key,
        description,
        plays
      `)
      .eq('id', beatId)
      .maybeSingle()  // Changed from .single() to .maybeSingle() for better error handling
      .then(({ data, error }) => {
        beatDetailPendingRequests.delete(beatId);
        
        if (error) throw error;

        const mappedBeat = data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
        
        // Store in cache
        beatCache.set(beatId, mappedBeat);
        
        return mappedBeat;
      })
      .catch(error => {
        beatDetailPendingRequests.delete(beatId);
        console.error('Error fetching beat by ID:', error);
        return null;
      }));
    
    beatDetailPendingRequests.set(beatId, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching beat by ID:', error);
    return null;
  }
};

// Cache for featured beats
const featuredBeatsCache = new Map<number, Beat[]>();

export const fetchFeaturedBeats = async (limit = 6): Promise<Beat[]> => {
  try {
    // Check cache first
    if (featuredBeatsCache.has(limit)) {
      return featuredBeatsCache.get(limit) || [];
    }
    
    const requestKey = `featured-beats-${limit}`;
    if (featuredBeatsPendingRequests.has(requestKey)) {
      console.log('Duplicate featured beats request prevented');
      return featuredBeatsPendingRequests.get(requestKey) as Promise<Beat[]>;
    }
    
    const requestPromise = Promise.resolve(supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(limit)
      .then(({ data, error }) => {
        featuredBeatsPendingRequests.delete(requestKey);
        
        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache
        featuredBeatsCache.set(limit, mappedBeats);
        
        return mappedBeats;
      })
      .catch(error => {
        featuredBeatsPendingRequests.delete(requestKey);
        console.error('Error fetching featured beats:', error);
        return [];
      }));
    
    featuredBeatsPendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    return [];
  }
};

// Function to clear all caches (useful after operations that modify data)
export const clearBeatsCache = (): void => {
  console.log('Clearing all beats caches');
  requestCache.clear();
  trendingCache.clear();
  newBeatsCache.clear();
  randomBeatsCache.clear();
  beatCache.clear();
  featuredBeatsCache.clear();
  
  // Important: Also clear pending requests maps to avoid stale requests
  pendingRequests.clear();
  trendingPendingRequests.clear();
  newBeatsPendingRequests.clear();
  randomBeatsPendingRequests.clear();
  beatDetailPendingRequests.clear();
  featuredBeatsPendingRequests.clear();
  
  // Also notify other components that cache has been cleared
  try {
    sessionStorage.setItem('beats_needs_refresh', 'true');
    
    // Dispatch storage event to notify other tabs
    if (window.dispatchEvent) {
      const event = new StorageEvent('storage', {
        key: 'beats_needs_refresh',
        newValue: 'true'
      });
      window.dispatchEvent(event);
    }
  } catch (e) {
    console.error('Could not set refresh notification:', e);
  }
};

export const fetchMarkedTrendingBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .eq('is_trending', true)
      .limit(limit);

    if (error) throw error;

    const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
    return mappedBeats;
  } catch (error) {
    console.error('Error fetching marked trending beats:', error);
    return [];
  }
};
