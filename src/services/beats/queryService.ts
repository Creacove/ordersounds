
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

export const fetchAllBeats = async (options: { 
  includeDetails?: boolean; 
  limit?: number; 
  includeDrafts?: boolean;
  producerId?: string;
} = {}): Promise<Beat[]> => {
  const { 
    limit = 20, 
    includeDrafts = false,
    producerId
  } = options;
  
  console.log('Fetching beats from database with options:', options);
  
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
    console.error("Error fetching beats:", beatsError);
    throw beatsError;
  }

  if (!beatsData || beatsData.length === 0) {
    return [];
  }
  
  return beatsData.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
};

export const fetchTrendingBeats = async (limit = 10, markedOnly = false): Promise<Beat[]> => {
  console.log('Fetching trending beats, limit:', limit, 'markedOnly:', markedOnly);
  
  let query = supabase
    .from('beats')
    .select(BEAT_QUERY_FIELDS)
    .eq('status', 'published');
    
  if (markedOnly) {
    query = query.eq('is_trending', true);
  } else {
    query = query.order('favorites_count', { ascending: false })
                .order('purchase_count', { ascending: false });
  }
  
  query = query.limit(limit);
    
  const { data, error } = await query;
    
  if (error) {
    console.error("Error fetching trending beats:", error);
    throw error;
  }
  
  return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
};

export const fetchNewBeats = async (limit = 10): Promise<Beat[]> => {
  console.log('Fetching new beats, limit:', limit);
  
  const { data, error } = await supabase
    .from('beats')
    .select(BEAT_QUERY_FIELDS)
    .eq('status', 'published')
    .order('upload_date', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching new beats:", error);
    throw error;
  }
  
  return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
};

export const fetchBeatById = async (beatId: string): Promise<Beat | null> => {
  console.log(`Fetching beat ${beatId} from database`);
  
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
    .maybeSingle();
  
  if (error) {
    // Handle but don't throw "not found" error
    if (error.code === 'PGRST116') {
      console.log(`Beat with ID ${beatId} not found`);
      return null;
    }
    console.error("Error fetching beat by ID:", error);
    throw error;
  }
  
  return data ? mapSupabaseBeatToBeat(data as SupabaseBeat) : null;
};

export const fetchFeaturedBeats = async (limit = 6): Promise<Beat[]> => {
  console.log('Fetching featured beats, limit:', limit);
  
  const { data, error } = await supabase
    .from('beats')
    .select(BEAT_QUERY_FIELDS)
    .eq('status', 'published')
    .eq('is_featured', true)
    .limit(limit);
    
  if (error) {
    console.error("Error fetching featured beats:", error);
    throw error;
  }
  
  return data?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
};

export const fetchProducerBeats = async (producerId: string, includeDrafts = true): Promise<Beat[]> => {
  console.log(`Fetching beats for producer ${producerId}`);
  
  if (!producerId) {
    console.warn('Producer ID is required to fetch producer beats');
    return [];
  }
  
  let query = supabase
    .from('beats')
    .select(BEAT_QUERY_FIELDS)
    .eq('producer_id', producerId);
    
  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching producer beats:", error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return [];
  }
  
  return data.map((beat) => mapSupabaseBeatToBeat(beat as SupabaseBeat));
};
