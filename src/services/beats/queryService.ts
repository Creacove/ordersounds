
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
    
    // Check if we already have a pending request for this exact query to prevent 
    // "body stream already read" errors when multiple components request the same data
    // Use a URL without getUrl() which doesn't exist on the client
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
    
    // Store this request in the pending map
    // Create a full Promise object instead of PromiseLike
    const requestPromise = new Promise<Beat[]>((resolve, reject) => {
      query.then(({ data: beatsData, error: beatsError }) => {
        // Remove from pending requests map when done
        pendingRequests.delete(requestKey);
        
        if (beatsError) {
          reject(beatsError);
          return;
        }

        if (beatsData && beatsData.length > 0) {
          const mappedBeats = beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
          
          // Store in session cache with timestamp (memory only, cleared when page refreshes)
          requestCache.set(cacheKey, { data: mappedBeats, timestamp: Date.now() });
          
          resolve(mappedBeats);
        } else {
          resolve([]);
        }
      }).catch(error => {
        pendingRequests.delete(requestKey);
        reject(error);
      });
    });
    
    pendingRequests.set(requestKey, requestPromise);
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
    
    // Create a full Promise with proper error handling
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
          
          // Store in cache
          trendingCache.set(limit, mappedBeats);
          
          resolve(mappedBeats);
        })
        .catch(error => {
          reject(error);
        });
    });
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
    
    // Create a full Promise with proper error handling
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
          
          // Store in cache with specific limit key
          newBeatsCache.set(cacheKey, mappedBeats);
          
          resolve(mappedBeats);
        })
        .catch(error => {
          reject(error);
        });
    });
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
    
    // Create a full Promise with proper error handling
    return new Promise<Beat[]>((resolve, reject) => {
      // Clone the query each time to prevent body stream already read errors
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
            
            // Store in cache
            randomBeatsCache.set(limit, mappedBeats);
            
            resolve(mappedBeats);
          } else {
            resolve([]);
          }
        })
        .catch(error => {
          reject(error);
        });
    });
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
    
    // Create a full Promise with proper error handling
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
              // This is "No rows returned" error, which we want to handle differently
              resolve(null);
              return;
            }
            reject(error);
            return;
          }
          
          const mappedBeat = data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
          
          // Store in cache
          beatCache.set(beatId, mappedBeat);
          
          resolve(mappedBeat);
        })
        .catch(error => {
          reject(error);
        });
    });
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
    
    // Create a full Promise with proper error handling
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
          
          // Store in cache
          featuredBeatsCache.set(limit, mappedBeats);
          
          resolve(mappedBeats);
        })
        .catch(error => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    uniqueToast.error("Failed to load featured beats");
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

export const fetchMarkedTrendingBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    // Create a full Promise with proper error handling
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
        })
        .catch(error => {
          reject(error);
        });
    });
  } catch (error) {
    console.error('Error fetching marked trending beats:', error);
    return [];
  }
};
