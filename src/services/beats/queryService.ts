
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

export const fetchAllBeats = async (options: { includeDetails?: boolean; limit?: number } = {}): Promise<Beat[]> => {
  try {
    const { includeDetails = true, limit = 0 } = options;
    
    let query = supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published');
    
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const { data: beatsData, error: beatsError } = await query;
    
    if (beatsError) {
      throw beatsError;
    }

    if (beatsData && beatsData.length > 0) {
      return beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all beats:', error);
    return [];
  }
};

export const fetchTrendingBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('favorites_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

export const fetchNewBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return [];
  }
};

export const fetchRandomBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    // Clone the query each time to prevent body stream already read errors
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .limit(limit);

    if (error) throw error;

    if (data && data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching random beats:', error);
    return [];
  }
};

export const fetchBeatById = async (beatId: string): Promise<Beat | null> => {
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
      .single();
    
    if (error) throw error;

    return data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
  } catch (error) {
    console.error('Error fetching beat by ID:', error);
    return null;
  }
};

// Function to fetch featured beats
export const fetchFeaturedBeats = async (limit = 6): Promise<Beat[]> => {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select(BEAT_QUERY_FIELDS)
      .eq('status', 'published')
      .eq('is_featured', true)
      .limit(limit);

    if (error) throw error;

    return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
  } catch (error) {
    console.error('Error fetching featured beats:', error);
    return [];
  }
};


