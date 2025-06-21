
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from './utils';
import { SupabaseBeat } from './types';

// Lean query fields - excludes heavy cover_image data
const LEAN_GENRE_FIELDS = `
  id,
  title,
  basic_license_price_local,
  basic_license_price_diaspora,
  genre,
  bpm,
  plays,
  favorites_count,
  purchase_count,
  producer_id,
  upload_date,
  status,
  users!beats_producer_id_fkey (
    stage_name,
    full_name
  )
`;

export async function fetchBeatsByGenre(genre: string, limit: number = 100): Promise<Beat[]> {
  try {
    console.log(`Fetching beats for genre: ${genre} using lean optimized query...`);
    
    const { data, error } = await supabase
      .from('beats')
      .select(LEAN_GENRE_FIELDS)
      .eq('status', 'published')
      .eq('genre', genre)
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map(beat => ({
      ...mapSupabaseBeatToBeat(beat as SupabaseBeat),
      producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
      cover_image_url: '/placeholder.svg' // Use placeholder initially for fast loading
    }));
  } catch (error) {
    console.error(`Failed to fetch beats for genre ${genre}:`, error);
    throw error;
  }
}

export async function fetchAllGenres(): Promise<string[]> {
  try {
    console.log('Fetching all available genres...');
    
    const { data, error } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null);

    if (error) throw error;

    const genres = [...new Set(data?.map(beat => beat.genre).filter(Boolean))];
    return genres.sort();
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return ['Afrobeat', 'Amapiano', 'Hip Hop', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}
