
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';

// Updated createBasicBeatsQuery to include new fields
const createBasicBeatsQuery = () => {
  return supabase
    .from('beats')
    .select(`
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
      is_weekly_pick
    `);
};

export const fetchAllBeats = async (options: { includeDetails?: boolean; limit?: number } = {}): Promise<Beat[]> => {
  try {
    const { includeDetails = true, limit = 0 } = options;
    
    let query = supabase
      .from('beats')
      .select(`
        id,
        title,
        producer_id,
        users (
          full_name,
          stage_name
        ),
        cover_image,
        audio_preview,
        ${includeDetails ? 'audio_file,' : ''}
        basic_license_price_local,
        basic_license_price_diaspora,
        ${includeDetails ? `
        premium_license_price_local,
        premium_license_price_diaspora,
        exclusive_license_price_local,
        exclusive_license_price_diaspora,
        custom_license_price_local,
        custom_license_price_diaspora,` : ''}
        genre,
        track_type,
        bpm,
        tags,
        ${includeDetails ? 'description,' : ''}
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
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
    const query = supabase
      .from('beats')
      .select(`
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
        is_trending
      `)
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('favorites_count', { ascending: false });

    if (limit > 0) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return data.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

export const fetchNewBeats = async (limit = 30): Promise<Beat[]> => {
  try {
    const query = supabase
      .from('beats')
      .select(`
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
        is_weekly_pick
      `)
      .eq('status', 'published')
      .order('upload_date', { ascending: false });

    if (limit > 0) {
      query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      return data.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching new beats:', error);
    return [];
  }
};

export const fetchRandomBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    const { data, error } = await createBasicBeatsQuery()
      .eq('status', 'published')
      .limit(limit);

    if (error) {
      throw error;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit).map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
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
        id,
        title,
        producer_id,
        users (
          full_name,
          stage_name
        ),
        cover_image,
        audio_preview,
        audio_file,
        basic_license_price_local,
        basic_license_price_diaspora,
        premium_license_price_local,
        premium_license_price_diaspora,
        exclusive_license_price_local,
        exclusive_license_price_diaspora,
        custom_license_price_local,
        custom_license_price_diaspora,
        genre,
        track_type,
        bpm,
        key,
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        plays,
        status
      `)
      .eq('id', beatId)
      .single();
    
    if (error) {
      throw error;
    }

    if (data) {
      return mapSupabaseBeatToBeat(data as SupabaseBeat);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching beat by ID:', error);
    return null;
  }
};
