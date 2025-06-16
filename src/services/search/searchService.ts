
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';

export interface SearchParams {
  query?: string;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  bpmMin?: number;
  bpmMax?: number;
  trackType?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResults {
  beats: Beat[];
  producers: any[];
  totalCount: number;
  hasMore: boolean;
}

export async function searchBeats(params: SearchParams): Promise<SearchResults> {
  const {
    query = '',
    genre,
    minPrice,
    maxPrice,
    bpmMin,
    bpmMax,
    trackType,
    limit = 20,
    offset = 0
  } = params;

  try {
    console.log('Searching beats with params:', params);

    // Build the query
    let beatsQuery = supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .range(offset, offset + limit - 1)
      .order('upload_date', { ascending: false });

    // Apply text search if query is provided
    if (query.trim()) {
      // Search in beat title and genre
      beatsQuery = beatsQuery.or(`title.ilike.%${query}%, genre.ilike.%${query}%`);
    }

    // Apply filters
    if (genre) {
      beatsQuery = beatsQuery.eq('genre', genre);
    }

    if (trackType) {
      beatsQuery = beatsQuery.eq('track_type', trackType);
    }

    if (bpmMin || bpmMax) {
      if (bpmMin) beatsQuery = beatsQuery.gte('bpm', bpmMin);
      if (bpmMax) beatsQuery = beatsQuery.lte('bpm', bpmMax);
    }

    if (minPrice || maxPrice) {
      if (minPrice) beatsQuery = beatsQuery.gte('basic_license_price_local', minPrice);
      if (maxPrice) beatsQuery = beatsQuery.lte('basic_license_price_local', maxPrice);
    }

    // Execute the query
    const { data: beatsData, error } = await beatsQuery;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Raw beats data:', beatsData);

    // Transform data
    const beats = (beatsData || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));

    console.log('Transformed beats:', beats);

    // Get total count for pagination (simplified for now)
    const hasMore = beats.length === limit;

    return {
      beats,
      producers: [], // Will be fetched separately
      totalCount: beats.length,
      hasMore
    };
  } catch (error) {
    console.error('Error searching beats:', error);
    // Return empty results instead of throwing
    return {
      beats: [],
      producers: [],
      totalCount: 0,
      hasMore: false
    };
  }
}

export async function searchProducers(query: string, limit = 10): Promise<any[]> {
  try {
    console.log('Searching producers with query:', query);
    
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, stage_name, profile_picture, bio, country, follower_count')
      .eq('role', 'producer')
      .or(`stage_name.ilike.%${query}%, full_name.ilike.%${query}%, country.ilike.%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Error searching producers:', error);
      return [];
    }
    
    console.log('Found producers:', data);
    return data || [];
  } catch (error) {
    console.error('Error searching producers:', error);
    return [];
  }
}

export async function getPopularSearchTerms(): Promise<string[]> {
  // Return hardcoded popular terms for now
  return ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
}

export async function getGenres(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null);

    if (error) {
      console.error('Error fetching genres:', error);
      return ['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop'];
    }

    const genres = [...new Set(data?.map(beat => beat.genre).filter(Boolean))];
    return genres.sort();
  } catch (error) {
    console.error('Error fetching genres:', error);
    return ['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}
