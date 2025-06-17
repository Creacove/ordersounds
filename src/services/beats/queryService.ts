import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from './utils';
import { SupabaseBeat } from './types';

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

    let query = supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .order('upload_date', { ascending: false });

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
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching beats:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch beats:', error);
    throw error;
  }
}

export async function fetchTrendingBeats(limit: number = 30): Promise<Beat[]> {
  try {
    console.log('Fetching trending beats...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending beats:', error);
      throw error;
    }

    // If no trending beats found, fall back to recent beats
    if (!data || data.length === 0) {
      console.log('No trending beats found, falling back to recent beats');
      return fetchNewBeats(limit);
    }

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} trending beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch trending beats:', error);
    throw error;
  }
}

export async function fetchMetricBasedTrending(limit: number = 100): Promise<Beat[]> {
  try {
    console.log('Fetching metrics-based trending beats...');
    
    // Get published beats with all metrics for trending calculation
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(500); // Get larger pool for better trending calculation

    if (error) {
      console.error('Error fetching metrics-based trending beats:', error);
      throw error;
    }

    // Calculate trending score for each beat
    const beatsWithScore = (data as SupabaseBeat[]).map(beat => {
      const plays = beat.plays || 0;
      const favorites = beat.favorites_count || 0;
      const purchases = beat.purchase_count || 0;
      
      // Calculate base trending score: plays (40%) + favorites (30%) + purchases (30%)
      const baseScore = (plays * 0.4) + (favorites * 0.3) + (purchases * 0.3);
      
      // Add recency boost for beats uploaded in last 30 days
      const uploadDate = new Date(beat.upload_date || '');
      const daysSinceUpload = Math.floor((Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24));
      const recencyBoost = daysSinceUpload <= 30 ? Math.max(0, 30 - daysSinceUpload) * 0.1 : 0;
      
      const finalScore = baseScore + recencyBoost;
      
      return {
        ...beat,
        trendingScore: finalScore
      };
    });

    // Sort by trending score in descending order
    const sortedBeats = beatsWithScore.sort((a, b) => b.trendingScore - a.trendingScore);
    
    // Take the requested limit
    const topBeats = sortedBeats.slice(0, limit);
    
    const beats = topBeats.map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} metrics-based trending beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch metrics-based trending beats:', error);
    throw error;
  }
}

// Simplified featured beats - just return trending beats flagged as featured
export async function fetchFeaturedBeats(limit: number = 1): Promise<Beat[]> {
  try {
    console.log('Fetching featured beats...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured beats:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} featured beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch featured beats:', error);
    throw error;
  }
}

export async function fetchNewBeats(limit: number = 20): Promise<Beat[]> {
  try {
    console.log('Fetching new beats...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching new beats:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} new beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch new beats:', error);
    throw error;
  }
}

export async function fetchRandomBeats(limit: number = 8): Promise<Beat[]> {
  try {
    console.log('Fetching random beats for weekly picks...');
    
    // Get a larger set first, then randomize client-side
    const { data, error } = await supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('status', 'published')
      .limit(100); // Get more to randomize from

    if (error) {
      console.error('Error fetching random beats:', error);
      throw error;
    }

    const allBeats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    
    // Shuffle and return requested limit
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
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
      .eq('producer_id', producerId)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching beats by producer:', error);
      throw error;
    }

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
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
      .select(`
        *,
        users!beats_producer_id_fkey (
          full_name,
          stage_name
        )
      `)
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

    const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
    console.log(`Successfully fetched ${beats.length} producer beats`);
    
    return beats;
  } catch (error) {
    console.error('Failed to fetch producer beats:', error);
    throw error;
  }
}
