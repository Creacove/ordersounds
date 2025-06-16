
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
    // Build the query with filters
    let beatsQuery = supabase
      .from('beats')
      .select(`
        *,
        users!beats_producer_id_fkey(stage_name, full_name, profile_picture)
      `)
      .eq('status', 'published')
      .range(offset, offset + limit - 1);

    // Apply text search on multiple fields
    if (query.trim()) {
      beatsQuery = beatsQuery.or(
        `title.ilike.%${query}%,` +
        `users.stage_name.ilike.%${query}%,` +
        `users.full_name.ilike.%${query}%,` +
        `genre.ilike.%${query}%,` +
        `tags.cs.{${query}}`
      );
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

    if (error) throw error;

    // Transform data
    const beats = (beatsData || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'
    }));

    // Get total count for pagination
    const { count } = await supabase
      .from('beats')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published');

    return {
      beats,
      producers: [], // Will be fetched separately
      totalCount: count || 0,
      hasMore: (offset + limit) < (count || 0)
    };
  } catch (error) {
    console.error('Error searching beats:', error);
    throw error;
  }
}

export async function searchProducers(query: string, limit = 10): Promise<any[]> {
  try {
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, stage_name, profile_picture, bio, country, follower_count')
      .eq('role', 'producer')
      .or(`stage_name.ilike.%${query}%, full_name.ilike.%${query}%, country.ilike.%${query}%`)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error searching producers:', error);
    return [];
  }
}

export async function getPopularSearchTerms(): Promise<string[]> {
  // This could be enhanced with analytics later
  return ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
}

export async function getGenres(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null);

    if (error) throw error;

    const genres = [...new Set(data?.map(beat => beat.genre).filter(Boolean))];
    return genres.sort();
  } catch (error) {
    console.error('Error fetching genres:', error);
    return ['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}
