
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

// Maximum age for cached results in milliseconds (1 hour)
// Increased cache duration to reduce network errors impact
const MAX_CACHE_AGE = 60 * 60 * 1000; 

// Function to check if cache is still valid
const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < MAX_CACHE_AGE;
}

// Global pending requests map - moved outside function to persist between calls
const pendingRequests = new Map<string, Promise<Beat[]>>();

// Exponential backoff settings
const BACKOFF_SETTINGS = {
  initialDelay: 500,
  maxDelay: 10000,
  maxRetries: 2
};

// Get backoff delay based on retry count
const getBackoffDelay = (retryCount: number): number => {
  return Math.min(
    BACKOFF_SETTINGS.initialDelay * Math.pow(2, retryCount),
    BACKOFF_SETTINGS.maxDelay
  );
};

// Mock data to use when database is unavailable
const getFallbackBeats = (count = 4): Beat[] => {
  const mockBeats: Beat[] = [];
  
  for (let i = 0; i < count; i++) {
    mockBeats.push({
      id: `fallback-${i}`,
      title: `Demo Beat ${i+1}`,
      producer_id: "demo-producer",
      producer_name: "Demo Producer",
      cover_image_url: "/placeholder.svg",
      preview_url: "",
      full_track_url: "",
      basic_license_price_local: 5000,
      basic_license_price_diaspora: 15,
      genre: "Afrobeat",
      track_type: "Single",
      bpm: 100 + i * 5,
      status: "published",
      is_featured: i === 0,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
      tags: ["demo"],
      favorites_count: 0,
      purchase_count: 0,
    });
  }
  
  return mockBeats;
};

export const fetchAllBeats = async (options: { 
  includeDetails?: boolean; 
  limit?: number; 
  includeDrafts?: boolean;
  producerId?: string;
  skipCache?: boolean;
  retryCount?: number;
  useFallback?: boolean;
} = {}): Promise<Beat[]> => {
  try {
    const { 
      includeDetails = true, 
      limit = 0, 
      includeDrafts = false,
      producerId,
      skipCache = false,
      retryCount = 0,
      useFallback = false
    } = options;
    
    // Use fallback data when explicitly requested
    if (useFallback) {
      console.log('Using fallback beats data');
      return getFallbackBeats(limit > 0 ? limit : 10);
    }
    
    // Create a cache key based on the query parameters
    const cacheKey = JSON.stringify({limit, includeDrafts, producerId});
    
    // Check in-memory cache first (only valid for current session) - unless skipCache is true
    if (!skipCache && requestCache.has(cacheKey)) {
      const cached = requestCache.get(cacheKey)!;
      
      // Only use cache if it's not too old
      if (isCacheValid(cached.timestamp)) {
        console.log(`Using in-memory cached beats data (age: ${Math.floor((Date.now() - cached.timestamp) / 1000)}s)`);
        return cached.data;
      } else {
        console.log('Cache expired, fetching fresh data');
      }
    }
    
    console.log(skipCache ? 'Bypassing cache and fetching fresh data' : 'Cache miss, fetching from database');
    
    // Check if we already have a pending request for this exact query
    const baseUrl = supabase.from('beats').url.toString();
    const requestKey = `GET:${baseUrl}?select=${encodeURIComponent(BEAT_QUERY_FIELDS)}${producerId ? `&producer_id=eq.${producerId}` : ''}${limit > 0 ? `&limit=${limit}` : ''}:${retryCount}`;
    
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
    
    // Use Promise.resolve to ensure we have a real Promise with catch method
    const requestPromise = Promise.resolve(query.then(({ data: beatsData, error: beatsError }) => {
      // Remove from pending requests map when done
      pendingRequests.delete(requestKey);
      
      if (beatsError) {
        // If we have retries left, back off and try again
        if (retryCount < BACKOFF_SETTINGS.maxRetries) {
          console.log(`Request failed, retrying in ${getBackoffDelay(retryCount)}ms (retry ${retryCount + 1}/${BACKOFF_SETTINGS.maxRetries})`);
          
          // Wait and retry with backoff
          return new Promise<Beat[]>((resolve) => {
            setTimeout(() => {
              resolve(fetchAllBeats({
                ...options,
                retryCount: retryCount + 1
              }));
            }, getBackoffDelay(retryCount));
          });
        }
        
        // If we've exhausted retries, return fallback data
        console.log('Exhausted retries, using fallback data');
        return getFallbackBeats(limit);
      }

      if (beatsData && beatsData.length > 0) {
        const mappedBeats = beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
        
        // Store in session cache with timestamp (memory only, cleared when page refreshes)
        requestCache.set(cacheKey, { data: mappedBeats, timestamp: Date.now() });
        
        return mappedBeats;
      }
      
      return [];
    }));
    
    // Now we can safely use .catch with Promise.resolve
    const finalPromise = requestPromise.catch(error => {
      // Remove from pending requests map on error
      pendingRequests.delete(requestKey);
      console.error('Error in fetchAllBeats:', error);
      
      // For network errors, retry with backoff if we have retries left
      if (retryCount < BACKOFF_SETTINGS.maxRetries) {
        console.log(`Network error, retrying in ${getBackoffDelay(retryCount)}ms (retry ${retryCount + 1}/${BACKOFF_SETTINGS.maxRetries})`);
        
        // Wait and retry with backoff
        return new Promise<Beat[]>((resolve) => {
          setTimeout(() => {
            resolve(fetchAllBeats({
              ...options, 
              retryCount: retryCount + 1
            }));
          }, getBackoffDelay(retryCount));
        });
      }
      
      // Fall back to demo data when all else fails
      console.log('Using fallback data after network error');
      return getFallbackBeats(limit);
    });
    
    pendingRequests.set(requestKey, finalPromise);
    return finalPromise;
  } catch (error) {
    console.error('Error fetching all beats:', error);
    return getFallbackBeats();
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
    // Check cache first
    if (trendingCache.has(limit)) {
      return trendingCache.get(limit) || [];
    }
    
    const requestKey = `trending-beats-${limit}`;
    if (trendingPendingRequests.has(requestKey)) {
      console.log('Duplicate trending beats request prevented');
      return trendingPendingRequests.get(requestKey) as Promise<Beat[]>;
    }
    
    const requestPromise = Promise.resolve(supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .order('favorites_count', { ascending: false })
      .order('purchase_count', { ascending: false })
      .limit(limit)
      .then(({ data, error }) => {
        trendingPendingRequests.delete(requestKey);
        
        if (error) throw error;

        const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        
        // Store in cache
        trendingCache.set(limit, mappedBeats);
        
        return mappedBeats;
      })
    );
    
    const finalPromise = requestPromise.catch(error => {
      trendingPendingRequests.delete(requestKey);
      console.error('Error fetching trending beats:', error);
      return getFallbackBeats(limit);
    });
    
    trendingPendingRequests.set(requestKey, finalPromise);
    return finalPromise;
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return getFallbackBeats(limit);
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
    );
    
    const finalPromise = requestPromise.catch(error => {
      newBeatsPendingRequests.delete(cacheKey);
      console.error('Error fetching new beats:', error);
      return getFallbackBeats(limit);
    });
    
    newBeatsPendingRequests.set(cacheKey, finalPromise);
    return finalPromise;
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return getFallbackBeats(limit);
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
    );
    
    const finalPromise = requestPromise.catch(error => {
      randomBeatsPendingRequests.delete(requestKey);
      console.error('Error fetching random beats:', error);
      return getFallbackBeats(limit);
    });
    
    randomBeatsPendingRequests.set(requestKey, finalPromise);
    return finalPromise;
  } catch (error) {
    console.error('Error fetching random beats:', error);
    return getFallbackBeats(limit);
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
    );
    
    const finalPromise = requestPromise.catch(error => {
      beatDetailPendingRequests.delete(beatId);
      console.error('Error fetching beat by ID:', error);
      
      // Create a fallback beat with the requested ID
      const fallbackBeat: Beat = {
        id: beatId,
        title: "Sample Beat",
        producer_id: "demo-producer",
        producer_name: "Demo Producer",
        cover_image_url: "/placeholder.svg",
        preview_url: "",
        full_track_url: "",
        basic_license_price_local: 5000,
        basic_license_price_diaspora: 15,
        genre: "Afrobeat",
        track_type: "Single",
        bpm: 100,
        status: "published",
        is_featured: false,
        created_at: new Date().toISOString(),
        tags: ["demo"],
        favorites_count: 0,
        purchase_count: 0,
      };
      
      return fallbackBeat;
    });
    
    beatDetailPendingRequests.set(beatId, finalPromise);
    return finalPromise;
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
    );
    
    const finalPromise = requestPromise.catch(error => {
      featuredBeatsPendingRequests.delete(requestKey);
      console.error('Error fetching featured beats:', error);
      
      // Create fallback featured beats
      const fallbackBeats = getFallbackBeats(limit).map(beat => ({
        ...beat,
        is_featured: true
      }));
      
      return fallbackBeats;
    });
    
    featuredBeatsPendingRequests.set(requestKey, finalPromise);
    return finalPromise;
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    return getFallbackBeats(limit).map(beat => ({...beat, is_featured: true}));
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
};

export const fetchMarkedTrendingBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .eq('is_trending', true)
      .limit(limit);

    if (error) {
      console.error('Error fetching marked trending beats:', error);
      return getFallbackBeats(limit).map(beat => ({...beat, is_trending: true}));
    }

    const mappedBeats = data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
    return mappedBeats;
  } catch (error) {
    console.error('Error fetching marked trending beats:', error);
    return getFallbackBeats(limit).map(beat => ({...beat, is_trending: true}));
  }
};
