
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

// Track pending requests to prevent duplicate fetches
const pendingRequests = new Map<string, Promise<Beat[]>>();

export const fetchAllBeats = async (options: { 
  includeDetails?: boolean; 
  limit?: number; 
  includeDrafts?: boolean;
  producerId?: string;
  skipCache?: boolean;
} = {}): Promise<Beat[]> => {
  try {
    const { 
      includeDetails = true, 
      limit = 0, 
      includeDrafts = false,
      producerId,
      skipCache = false
    } = options;
    
    // Create a cache key based on the query parameters
    const cacheKey = JSON.stringify({limit, includeDrafts, producerId});
    
    // Check in-memory cache first (only valid for current session) - unless skipCache is true
    if (!skipCache && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey)!;
      
      // Only use cache if it's not too old
      if (isCacheValid(cached.timestamp)) {
        console.log('Using in-memory cached beats data (age:', Date.now() - cached.timestamp, 'ms)');
        return cached.data;
      } else {
        console.log('Cache expired, fetching fresh data');
      }
    }
    
    console.log(skipCache ? 'Bypassing cache and fetching fresh data' : 'Cache miss, fetching from database');
    
    // Create a unique request key for this query
    const baseUrl = supabase.from('beats').url.toString();
    const requestKey = `GET:${baseUrl}?select=${encodeURIComponent(BEAT_QUERY_FIELDS)}${producerId ? `&producer_id=eq.${producerId}` : ''}${limit > 0 ? `&limit=${limit}` : ''}:""`;
    
    // Check if we already have a pending request for this exact query
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate request prevented:', requestKey);
      return pendingRequests.get(requestKey)!;
    }
    
    let query = supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS);
    
    // Only filter by published status if we're not including drafts
    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }
    
    // If producerId is provided, filter beats by that producer
    if (producerId) {
      query = query.eq('producer_id', producerId);
    }
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    // Create a new promise for this request
    const requestPromise = (async () => {
      try {
        // Clone the query to avoid body stream already read errors
        const { data: beatsData, error: beatsError } = await query;
        
        if (beatsError) {
          throw beatsError;
        }

        if (beatsData && beatsData.length > 0) {
          const mappedBeats = beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
          
          // Store in session cache with timestamp (memory only, cleared when page refreshes)
          requestCache.set(cacheKey, { data: mappedBeats, timestamp: Date.now() });
          
          return mappedBeats;
        }
        
        return [];
      } finally {
        // Remove from pending requests map when done (whether successful or not)
        pendingRequests.delete(requestKey);
      }
    })();
    
    // Store the promise in the pending requests map
    pendingRequests.set(requestKey, requestPromise);
    
    // Return the promise
    return requestPromise;
  } catch (error) {
    console.error('Error fetching all beats:', error);
    return [];
  }
};

// Cache for trending beats (memory only, cleared when page refreshes)
const trendingCache = new Map<number, Beat[]>();

export const fetchTrendingBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    // Check cache first
    if (trendingCache.has(limit)) {
      return trendingCache.get(limit) || [];
    }
    
    const requestKey = `trending-beats-${limit}`;
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate trending beats request prevented');
      return pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(BEAT_QUERY_FIELDS)
          .eq('status', 'published')
          .eq('is_trending', true)
          .order('favorites_count', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache
        trendingCache.set(limit, mappedBeats);
        
        return mappedBeats;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

// Cache for new beats
const newBeatsCache = new Map<number, Beat[]>();

export const fetchNewBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    // Check cache first
    if (newBeatsCache.has(limit)) {
      return newBeatsCache.get(limit) || [];
    }
    
    const requestKey = `new-beats-${limit}`;
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate new beats request prevented');
      return pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(BEAT_QUERY_FIELDS)
          .eq('status', 'published')
          .order('upload_date', { ascending: false })
          .limit(limit);

        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache
        newBeatsCache.set(limit, mappedBeats);
        
        return mappedBeats;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
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
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate random beats request prevented');
      return pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(BEAT_QUERY_FIELDS)
          .eq('status', 'published')
          .limit(limit);

        if (error) throw error;

        if (data && data.length > 0) {
          const shuffled = [...data].sort(() => Math.random() - 0.5);
          const mappedBeats = shuffled.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
          
          // Store in cache
          randomBeatsCache.set(limit, mappedBeats);
          
          return mappedBeats;
        }
        
        return [];
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
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
    
    const requestKey = `beat-${beatId}`;
    if (pendingRequests.has(requestKey)) {
      console.log(`Duplicate beat request prevented for ID: ${beatId}`);
      return (await pendingRequests.get(requestKey)!)[0] || null;
    }
    
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
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
          .maybeSingle();
        
        if (error) throw error;

        const mappedBeat = data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
        
        // Store in cache
        beatCache.set(beatId, mappedBeat);
        
        return [mappedBeat];
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise as Promise<Beat[]>);
    return (await requestPromise)[0] || null;
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
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate featured beats request prevented');
      return pendingRequests.get(requestKey)!;
    }
    
    const requestPromise = (async () => {
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(BEAT_QUERY_FIELDS)
          .eq('status', 'published')
          .eq('is_featured', true)
          .limit(limit);

        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache
        featuredBeatsCache.set(limit, mappedBeats);
        
        return mappedBeats;
      } finally {
        pendingRequests.delete(requestKey);
      }
    })();
    
    pendingRequests.set(requestKey, requestPromise);
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
  
  // Also clear the pending requests map
  pendingRequests.clear();
  
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
