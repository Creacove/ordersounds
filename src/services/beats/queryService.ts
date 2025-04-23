
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
const requestCache = new Map<string, Beat[]>();

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
    
    // Check cache first (only valid for current session) - unless skipCache is true
    if (!skipCache && requestCache.has(cacheKey)) {
      console.log('Using in-memory cached beats data');
      return requestCache.get(cacheKey) || [];
    }
    
    console.log(skipCache ? 'Bypassing cache and fetching fresh data' : 'Cache miss, fetching from database');
    
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
    
    const { data: beatsData, error: beatsError } = await query;
    
    if (beatsError) {
      throw beatsError;
    }

    if (beatsData && beatsData.length > 0) {
      const mappedBeats = beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
      
      // Store in session cache (memory only, cleared when page refreshes)
      requestCache.set(cacheKey, mappedBeats);
      
      return mappedBeats;
    }
    
    return [];
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
    
    // Clone the query each time to prevent body stream already read errors
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
      .single();
    
    if (error) throw error;

    const mappedBeat = data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
    
    // Store in cache
    beatCache.set(beatId, mappedBeat);
    
    return mappedBeat;
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
};
