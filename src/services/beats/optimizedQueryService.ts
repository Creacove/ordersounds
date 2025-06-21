
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from './utils';
import { SupabaseBeat } from './types';

// Lean query fields - excludes heavy cover_image data
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
  track_type
`;

const LEAN_BEAT_FIELDS_WITH_USER = `
  ${LEAN_BEAT_FIELDS},
  users!beats_producer_id_fkey (
    stage_name,
    full_name
  )
`;

export async function fetchTrendingBeatsOptimized(limit: number = 30): Promise<Beat[]> {
  try {
    console.log('Fetching trending beats using lean optimized query...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS_WITH_USER)
      .eq('status', 'published')
      .eq('is_trending', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat as SupabaseBeat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
  } catch (error) {
    console.error('Failed to fetch trending beats:', error);
    throw error;
  }
}

export async function fetchNewBeatsOptimized(limit: number = 20): Promise<Beat[]> {
  try {
    console.log('Fetching new beats using lean optimized query...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS_WITH_USER)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat as SupabaseBeat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
  } catch (error) {
    console.error('Failed to fetch new beats:', error);
    throw error;
  }
}

export async function fetchFeaturedBeatsOptimized(limit: number = 1): Promise<Beat[]> {
  try {
    console.log('Fetching featured beats using lean optimized query...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS_WITH_USER)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat as SupabaseBeat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
  } catch (error) {
    console.error('Failed to fetch featured beats:', error);
    throw error;
  }
}

export async function getMetricBasedTrendingOptimized(limit: number = 100): Promise<Beat[]> {
  try {
    console.log('Fetching metrics-based trending using lean optimized query...');
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_BEAT_FIELDS_WITH_USER)
      .eq('status', 'published')
      .not('plays', 'is', null)
      .order('plays', { ascending: false })
      .order('favorites_count', { ascending: false })
      .order('purchase_count', { ascending: false })
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat as SupabaseBeat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      cover_image_url: '/placeholder.svg' // Use placeholder initially
    }));
  } catch (error) {
    console.error('Failed to fetch metrics-based trending beats:', error);
    throw error;
  }
}

// Function to lazy load cover image for a specific beat
export async function fetchBeatCoverImage(beatId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('beats')
      .select('cover_image')
      .eq('id', beatId)
      .maybeSingle();

    if (error) throw error;
    
    return data?.cover_image || null;
  } catch (error) {
    console.error('Failed to fetch beat cover image:', error);
    return null;
  }
}
