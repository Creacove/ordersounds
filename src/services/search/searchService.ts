
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';
import { 
  optimizedSearchBeats, 
  optimizedSearchProducers,
  OptimizedSearchParams,
  OptimizedSearchResults 
} from './optimizedSearchService';

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

// Use the optimized search by default
export async function searchBeats(params: SearchParams): Promise<SearchResults> {
  return optimizedSearchBeats(params as OptimizedSearchParams);
}

export async function searchProducers(query: string, limit = 10): Promise<any[]> {
  return optimizedSearchProducers(query, limit);
}

export async function getPopularSearchTerms(): Promise<string[]> {
  try {
    // Get popular genres and terms from actual data using our indexes
    const { data: genreData } = await supabase
      .from('beats')
      .select('genre')
      .eq('status', 'published')
      .not('genre', 'is', null)
      .limit(100);

    const genres = [...new Set(genreData?.map(beat => beat.genre).filter(Boolean))];
    
    // Return top genres as popular search terms
    const popularTerms = ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
    return [...new Set([...popularTerms, ...genres.slice(0, 10)])];
  } catch (error) {
    console.error('Error fetching popular search terms:', error);
    return ['Afrobeat', 'Hip Hop', 'Amapiano', 'R&B', 'Trap', 'Dancehall', 'Pop'];
  }
}

export async function getGenres(): Promise<string[]> {
  try {
    // Use our genre index for fast genre lookup
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
