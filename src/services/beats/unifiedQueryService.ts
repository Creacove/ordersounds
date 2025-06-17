
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from './utils';
import { SupabaseBeat } from './types';

interface UnifiedBeatsResponse {
  trendingBeats: Beat[];
  newBeats: Beat[];
  weeklyPicks: Beat[];
  featuredBeats: Beat[];
  allBeats: Beat[];
}

// Connection pool management
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;
const requestQueue: Array<() => Promise<any>> = [];

const executeWithQueue = async <T>(fn: () => Promise<T>): Promise<T> => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    return new Promise((resolve, reject) => {
      requestQueue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  activeRequests++;
  try {
    const result = await fn();
    return result;
  } finally {
    activeRequests--;
    if (requestQueue.length > 0) {
      const nextRequest = requestQueue.shift();
      if (nextRequest) {
        setTimeout(nextRequest, 50); // Small delay to prevent overwhelming
      }
    }
  }
};

// Unified query with LEFT JOIN for graceful handling of missing producers
export async function fetchAllBeatsUnified(): Promise<UnifiedBeatsResponse> {
  console.log('🔄 Fetching all beats with unified query...');
  
  try {
    const result = await executeWithQueue(async () => {
      // Use LEFT JOIN to handle missing producer data gracefully
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          producer:users!left(
            full_name,
            stage_name
          )
        `)
        .eq('status', 'published')
        .order('upload_date', { ascending: false })
        .limit(200); // Get enough for all categories

      if (error) {
        console.error('❌ Unified beats query error:', error);
        throw error;
      }

      return data || [];
    });

    // Map beats with fallback for missing producer data
    const allBeats = result.map((beat: any) => {
      const mappedBeat = mapSupabaseBeatToBeat({
        ...beat,
        users: beat.producer || null
      } as SupabaseBeat);
      
      // Ensure producer name fallback
      if (!mappedBeat.producer_name || mappedBeat.producer_name === 'Unknown Producer') {
        mappedBeat.producer_name = beat.producer?.stage_name || 
                                  beat.producer?.full_name || 
                                  'Anonymous Producer';
      }
      
      return mappedBeat;
    });

    // Categorize beats efficiently
    const trendingBeats = allBeats.filter(beat => beat.is_trending).slice(0, 30);
    const featuredBeats = allBeats.filter(beat => beat.is_featured).slice(0, 5);
    const newBeats = allBeats.slice(0, 30); // Most recent first
    
    // Create weekly picks from a diverse selection
    const weeklyPicks = createWeeklyPicksSelection(allBeats, 8);

    console.log('✅ Unified beats query successful:', {
      trending: trendingBeats.length,
      featured: featuredBeats.length,
      new: newBeats.length,
      weekly: weeklyPicks.length,
      total: allBeats.length
    });

    return {
      trendingBeats,
      newBeats,
      weeklyPicks,
      featuredBeats,
      allBeats
    };
  } catch (error) {
    console.error('💥 Unified beats query failed:', error);
    // Return empty arrays instead of throwing to prevent app crashes
    return {
      trendingBeats: [],
      newBeats: [],
      weeklyPicks: [],
      featuredBeats: [],
      allBeats: []
    };
  }
}

// Smart selection for weekly picks to ensure diversity
function createWeeklyPicksSelection(beats: Beat[], count: number): Beat[] {
  if (beats.length === 0) return [];
  
  // Create a diverse selection by genre and recency
  const genreMap = new Map<string, Beat[]>();
  
  beats.forEach(beat => {
    const genre = beat.genre || 'Other';
    if (!genreMap.has(genre)) {
      genreMap.set(genre, []);
    }
    genreMap.get(genre)!.push(beat);
  });
  
  const weeklyPicks: Beat[] = [];
  const genres = Array.from(genreMap.keys());
  let genreIndex = 0;
  
  while (weeklyPicks.length < count && weeklyPicks.length < beats.length) {
    const currentGenre = genres[genreIndex % genres.length];
    const genreBeats = genreMap.get(currentGenre) || [];
    
    // Find a beat from this genre that isn't already selected
    const availableBeat = genreBeats.find(beat => 
      !weeklyPicks.some(selected => selected.id === beat.id)
    );
    
    if (availableBeat) {
      weeklyPicks.push(availableBeat);
    }
    
    genreIndex++;
    
    // If we've cycled through all genres, break to avoid infinite loop
    if (genreIndex > genres.length * 3) break;
  }
  
  // Fill remaining slots with any available beats
  while (weeklyPicks.length < count) {
    const availableBeat = beats.find(beat => 
      !weeklyPicks.some(selected => selected.id === beat.id)
    );
    
    if (!availableBeat) break;
    weeklyPicks.push(availableBeat);
  }
  
  return weeklyPicks;
}

// Fallback query for individual beat types if needed
export async function fetchBeatsByType(type: 'trending' | 'new' | 'featured'): Promise<Beat[]> {
  console.log(`🔄 Fetching ${type} beats as fallback...`);
  
  try {
    return await executeWithQueue(async () => {
      let query = supabase
        .from('beats')
        .select(`
          *,
          producer:users!left(
            full_name,
            stage_name
          )
        `)
        .eq('status', 'published');

      switch (type) {
        case 'trending':
          query = query.eq('is_trending', true).limit(30);
          break;
        case 'featured':
          query = query.eq('is_featured', true).limit(5);
          break;
        case 'new':
          query = query.order('upload_date', { ascending: false }).limit(30);
          break;
      }

      const { data, error } = await query;

      if (error) {
        console.error(`❌ ${type} beats fallback query error:`, error);
        return [];
      }

      const beats = (data || []).map((beat: any) => 
        mapSupabaseBeatToBeat({
          ...beat,
          users: beat.producer || null
        } as SupabaseBeat)
      );

      console.log(`✅ ${type} beats fallback successful:`, beats.length);
      return beats;
    });
  } catch (error) {
    console.error(`💥 ${type} beats fallback failed:`, error);
    return [];
  }
}
