
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from './utils';
import { SupabaseBeat } from './types';
import {
  fetchTrendingBeatsOptimized,
  fetchNewBeatsOptimized,
  fetchFeaturedBeatsOptimized,
  fetchMetricBasedTrendingOptimized
} from './optimizedQueryService';

interface FetchBeatsOptions {
  limit?: number;
  includeDrafts?: boolean;
  producerId?: string;
  genre?: string;
  searchQuery?: string;
}

// React Query cache management
let queryClient: any = null;

export const setQueryClient = (client: any) => {
  queryClient = client;
};

export const clearBeatsCache = () => {
  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ['beats'] });
    queryClient.invalidateQueries({ queryKey: ['trending-beats'] });
    queryClient.invalidateQueries({ queryKey: ['metrics-trending-beats'] });
    queryClient.invalidateQueries({ queryKey: ['new-beats'] });
    queryClient.invalidateQueries({ queryKey: ['weekly-picks'] });
    console.log('React Query cache cleared');
  }
};

// Lean fields for performance - excludes heavy cover_image
const LEAN_BEAT_FIELDS = `
  id,
  title,
  basic_license_price_local,
  basic_license_price_diaspora,
  premium_license_price_local,
  premium_license_price_diaspora,
  exclusive_license_price_local,
  exclusive_license_price_diaspora,
  custom_license_price_local,
  custom_license_price_diaspora,
  genre,
  bpm,
  plays,
  favorites_count,
  purchase_count,
  producer_id,
  upload_date,
  status,
  is_featured,
  is_trending,
  is_weekly_pick,
  audio_preview,
  tags,
  key,
  track_type,
  users!beats_producer_id_fkey (
    full_name,
    stage_name
  )
`;

export async function fetchAllBeats(options: FetchBeatsOptions = {}): Promise<Beat[]> {
  const {
    limit = 50,
    includeDrafts = false,
    producerId,
    genre,
    searchQuery
  } = options;

  try {
    console.log('Fetching beats with options:', options);

    // Use lean query to avoid massive cover_image data
    let query = supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS);

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    if (producerId) {
      query = query.eq('producer_id', producerId);
    }

    if (genre) {
      query = query.eq('genre', genre);
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = query.or(`title.ilike.%${searchTerm}%,genre.ilike.%${searchTerm}%`);
    }

    query = query.order('upload_date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching beats:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      cover_image_url: '/placeholder.svg' // Use placeholder initially for fast loading
    }));
    
    console.log(`Successfully fetched ${beats.length} beats`);
    return beats;
  } catch (error) {
    console.error('Failed to fetch beats:', error);
    throw error;
  }
}

// Use optimized functions for better performance
export async function fetchTrendingBeats(limit: number = 30): Promise<Beat[]> {
  try {
    console.log('Fetching trending beats using optimized query...');
    return await fetchTrendingBeatsOptimized(limit);
  } catch (error) {
    console.error('Failed to fetch trending beats:', error);
    throw error;
  }
}

export async function fetchMetricBasedTrending(limit: number = 100): Promise<Beat[]> {
  try {
    console.log('Fetching metrics-based trending beats using optimized query...');
    return await fetchMetricBasedTrendingOptimized(limit);
  } catch (error) {
    console.error('Failed to fetch metrics-based trending beats:', error);
    throw error;
  }
}

export async function fetchFeaturedBeats(limit: number = 1): Promise<Beat[]> {
  try {
    console.log('Fetching featured beats using optimized query...');
    return await fetchFeaturedBeatsOptimized(limit);
  } catch (error) {
    console.error('Failed to fetch featured beats:', error);
    throw error;
  }
}

export async function fetchNewBeats(limit: number = 20): Promise<Beat[]> {
  try {
    console.log('Fetching new beats using optimized query...');
    return await fetchNewBeatsOptimized(limit);
  } catch (error) {
    console.error('Failed to fetch new beats:', error);
    throw error;
  }
}

export async function fetchRandomBeats(limit: number = 8): Promise<Beat[]> {
  try {
    console.log('Fetching random beats for weekly picks...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching random beats:', error);
      throw error;
    }

    const allBeats = (data as SupabaseBeat[]).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
    
    const shuffled = allBeats.sort(() => 0.5 - Math.random());
    const randomBeats = shuffled.slice(0, limit);
    
    console.log(`Successfully fetched ${randomBeats.length} random beats`);
    return randomBeats;
  } catch (error) {
    console.error('Failed to fetch random beats:', error);
    throw error;
  }
}

export async function fetchBeatById(id: string): Promise<Beat | null> {
  try {
    console.log('Fetching beat by ID:', id);
    
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching beat by ID:', error);
      throw error;
    }

    if (!data) {
      console.log('Beat not found with ID:', id);
      return null;
    }

    const beat = mapSupabaseBeatToBeat(data as SupabaseBeat);
    console.log('Successfully fetched beat:', beat.title);
    
    return beat;
  } catch (error) {
    console.error('Failed to fetch beat by ID:', error);
    throw error;
  }
}

export async function fetchBeatsByProducer(producerId: string, limit: number = 20): Promise<Beat[]> {
  try {
    console.log('Fetching beats by producer:', producerId);
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS)
      .eq('producer_id', producerId)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching beats by producer:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
    
    console.log(`Successfully fetched ${beats.length} beats by producer`);
    return beats;
  } catch (error) {
    console.error('Failed to fetch beats by producer:', error);
    throw error;
  }
}

export async function fetchProducerBeats(producerId: string, includeDrafts: boolean = false): Promise<Beat[]> {
  try {
    console.log('Fetching producer beats:', producerId, 'includeDrafts:', includeDrafts);
    
    let query = supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS)
      .eq('producer_id', producerId)
      .order('upload_date', { ascending: false });

    if (!includeDrafts) {
      query = query.eq('status', 'published');
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching producer beats:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
    
    console.log(`Successfully fetched ${beats.length} producer beats`);
    return beats;
  } catch (error) {
    console.error('Failed to fetch producer beats:', error);
    throw error;
  }
}
