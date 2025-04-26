
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';
import { uniqueToast } from '@/lib/toast';

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

// Define additional cache maps for different beat query types
const trendingCache = new Map<number, Beat[]>();
const newBeatsCache = new Map<string, Beat[]>();
const randomBeatsCache = new Map<number, Beat[]>();
const beatCache = new Map<string, Beat | null>();
const featuredBeatsCache = new Map<number, Beat[]>();

// Maximum age for cached results in milliseconds (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000; 

// Function to check if cache is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < MAX_CACHE_AGE;
}

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
    
    const baseUrl = supabase.from('beats').url.toString();
    const requestKey = `GET:${baseUrl}?select=${encodeURIComponent(BEAT_QUERY_FIELDS)}${producerId ? `&producer_id=eq.${producerId}` : ''}${limit > 0 ? `&limit=${limit}` : ''}:""`;
    const pendingRequests = new Map<string, Promise<any>>();
    
    if (pendingRequests.has(requestKey)) {
      console.log('Duplicate request prevented:', requestKey);
      return pendingRequests.get(requestKey) as Promise<Beat[]>;
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
    
    // Create a full Promise with proper error handling
    const requestPromise = new Promise<Beat[]>((resolve, reject) => {
      query
        .then(({ data: beatsData, error: beatsError }) => {
          pendingRequests.delete(requestKey);
          
          if (beatsError) {
            reject(beatsError);
            return;
          }

          if (beatsData && beatsData.length > 0) {
            const mappedBeats = beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
            requestCache.set(cacheKey, { data: mappedBeats, timestamp: Date.now() });
            resolve(mappedBeats);
          } else {
            resolve([]);
          }
        });
    });
    
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  } catch (error) {
    console.error('Error fetching all beats:', error);
    return [];
  }
};

export const fetchTrendingBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    if (trendingCache.has(limit)) {
      return trendingCache.get(limit) || [];
    }
    
    return new Promise<Beat[]>((resolve, reject) => {
      supabase
        .from('beats')
        .select(BEAT_QUERY_FIELDS)
        .eq('status', 'published')
        .order('favorites_count', { ascending: false })
        .order('purchase_count', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }
          
          const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
          trendingCache.set(limit, mappedBeats);
          resolve(mappedBeats);
        });
    });
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

export const fetchNewBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    const cacheKey = `new-beats-${limit}`;
    
    if (newBeatsCache.has(cacheKey)) {
      return newBeatsCache.get(cacheKey) || [];
    }
    
    return new Promise<Beat[]>((resolve, reject) => {
      supabase
        .from('beats')
        .select(BEAT_QUERY_FIELDS)
        .eq('status', 'published')
        .order('upload_date', { ascending: false })
        .limit(limit)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }
          
          const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
          newBeatsCache.set(cacheKey, mappedBeats);
          resolve(mappedBeats);
        });
    });
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return [];
  }
};

export const fetchRandomBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    if (randomBeatsCache.has(limit)) {
      return randomBeatsCache.get(limit) || [];
    }
    
    return new Promise<Beat[]>((resolve, reject) => {
      supabase
        .from('beats')
        .select(BEAT_QUERY_FIELDS)
        .eq('status', 'published')
        .limit(limit)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }
          
          if (data && data.length > 0) {
            const shuffled = [...data].sort(() => Math.random() - 0.5);
            const mappedBeats = shuffled.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
            randomBeatsCache.set(limit, mappedBeats);
            resolve(mappedBeats);
          } else {
            resolve([]);
          }
        });
    });
  } catch (error) {
    console.error('Error fetching random beats:', error);
    return [];
  }
};

export const fetchBeatById = async (beatId: string): Promise<Beat | null> => {
  try {
    if (beatCache.has(beatId)) {
      return beatCache.get(beatId) || null;
    }
    
    return new Promise<Beat | null>((resolve, reject) => {
      supabase
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
        .single()
        .then(({ data, error }) => {
          if (error) {
            if (error.code === 'PGRST116') {
              resolve(null);
              return;
            }
            reject(error);
            return;
          }
          
          const mappedBeat = data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
          beatCache.set(beatId, mappedBeat);
          resolve(mappedBeat);
        });
    });
  } catch (error) {
    console.error('Error fetching beat by ID:', error);
    return null;
  }
};

export const fetchFeaturedBeats = async (limit = 6): Promise<Beat[]> => {
  try {
    if (featuredBeatsCache.has(limit)) {
      return featuredBeatsCache.get(limit) || [];
    }
    
    return new Promise<Beat[]>((resolve, reject) => {
      supabase
        .from('beats')
        .select(BEAT_QUERY_FIELDS)
        .eq('status', 'published')
        .eq('is_featured', true)
        .limit(limit)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }
          
          const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
          featuredBeatsCache.set(limit, mappedBeats);
          resolve(mappedBeats);
        });
    });
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    uniqueToast.error("Failed to load featured beats");
    return [];
  }
};

export const fetchMarkedTrendingBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    return new Promise<Beat[]>((resolve, reject) => {
      supabase
        .from('beats')
        .select(BEAT_QUERY_FIELDS)
        .eq('status', 'published')
        .eq('is_trending', true)
        .limit(limit)
        .then(({ data, error }) => {
          if (error) {
            reject(error);
            return;
          }
          
          const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
          resolve(mappedBeats);
        });
    });
  } catch (error) {
    console.error('Error fetching marked trending beats:', error);
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
