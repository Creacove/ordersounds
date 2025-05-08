import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';

// Function to fetch the current featured beat
export const fetchCurrentFeaturedBeat = async (): Promise<Beat | null> => {
  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('is_featured', true)
    .single();

  if (error) {
    console.error("Error fetching current featured beat:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return mapSupabaseBeatToBeat(data as SupabaseBeat);
};

// Function to fetch genre counts
export const fetchGenreCounts = async (): Promise<{ name: string; count: number }[]> => {
  const { data, error } = await supabase
    .from('genres')
    .select('name')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching genres:", error);
    return [];
  }

  const genreCounts: { name: string; count: number }[] = [];

  for (const genre of data) {
    const { count, error: countError } = await supabase
      .from('beats')
      .select('*', { count: 'exact' })
      .like('genre', `%${genre.name}%`);

    if (countError) {
      console.error(`Error fetching count for genre ${genre.name}:`, countError);
      continue;
    }

    genreCounts.push({ name: genre.name, count: count || 0 });
  }

  return genreCounts;
};

// Define cache storage
const beatsByGenreCache = new Map<string, { data: Beat[], timestamp: number }>();
const randomBeatsCache = new Map<number, Beat[]>();
const beatCache = new Map<string, Beat | null>();
const featuredBeatsCache = new Map<number, Beat[]>();
// Cache maps for new functions
const trendingBeatsCache = new Map<number, Beat[]>();
const allBeatsCache = new Map<string, { data: Beat[], timestamp: number }>();
const newBeatsCache = new Map<number, Beat[]>();
// Weekly picks cache (global scope)
const weeklyPicksCache = new Map<string, { data: Beat[], timestamp: number }>();

// Maximum age for cached results in milliseconds (5 minutes)
const MAX_CACHE_AGE = 5 * 60 * 1000; 

// Function to fetch all genres
export const fetchGenres = async (): Promise<{ id: number; name: string }[]> => {
  const { data, error } = await supabase
    .from('genres')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching genres:", error);
    return [];
  }

  return data || [];
};

// Function to fetch trending beats
export const fetchTrendingBeats = async (count: number = 10): Promise<Beat[]> => {
  // Return from cache if available
  if (trendingBeatsCache.has(count)) {
    return trendingBeatsCache.get(count)!;
  }

  // Otherwise fetch from database
  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('status', 'published')
    .order('favorites_count', { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching trending beats:", error);
    return [];
  }

  const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  trendingBeatsCache.set(count, beats);
  return beats;
};

// Function to fetch new beats
export const fetchNewBeats = async (count: number = 10): Promise<Beat[]> => {
  // Return from cache if available
  if (newBeatsCache.has(count)) {
    return newBeatsCache.get(count)!;
  }

  // Otherwise fetch from database
  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('status', 'published')
    .order('upload_date', { ascending: false })
    .limit(count);

  if (error) {
    console.error("Error fetching new beats:", error);
    return [];
  }

  const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  newBeatsCache.set(count, beats);
  return beats;
};

// Function to fetch all beats with optional filters
export const fetchAllBeats = async (options?: { 
  includeDrafts?: boolean, 
  producerId?: string, 
  limit?: number,
  skipCache?: boolean
}): Promise<Beat[]> => {
  const cacheKey = `all_beats_${options?.includeDrafts}_${options?.producerId}_${options?.limit}`;
  
  // Return from cache if available and not explicitly skipping cache
  if (!options?.skipCache && allBeatsCache.has(cacheKey)) {
    const cached = allBeatsCache.get(cacheKey)!;
    const now = Date.now();
    
    if (now - cached.timestamp < MAX_CACHE_AGE) {
      return cached.data;
    }
  }

  // Build the query
  let query = supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)');
  
  // Apply filters
  if (!options?.includeDrafts) {
    query = query.eq('status', 'published');
  }
  
  if (options?.producerId) {
    query = query.eq('producer_id', options.producerId);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  // Execute query
  const { data, error } = await query;

  if (error) {
    console.error("Error fetching all beats:", error);
    return [];
  }

  const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  
  // Cache the results if not explicitly skipping cache
  if (!options?.skipCache) {
    allBeatsCache.set(cacheKey, {
      data: beats,
      timestamp: Date.now()
    });
  }
  
  return beats;
};

// Function to fetch random beats
export const fetchRandomBeats = async (count: number = 3): Promise<Beat[]> => {
  if (randomBeatsCache.has(count)) {
    return randomBeatsCache.get(count)!;
  }

  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .limit(count);

  if (error) {
    console.error("Error fetching random beats:", error);
    return [];
  }

  const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  randomBeatsCache.set(count, beats);
  return beats;
};

// Function to fetch a beat by ID
export const fetchBeatById = async (id: string): Promise<Beat | null> => {
  if (beatCache.has(id)) {
    return beatCache.get(id)!;
  }

  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching beat with ID ${id}:`, error);
    return null;
  }

  if (!data) {
    return null;
  }

  const beat = mapSupabaseBeatToBeat(data as SupabaseBeat);
  beatCache.set(id, beat);
  return beat;
};

// Function to fetch featured beats
export const fetchFeaturedBeats = async (count: number = 6): Promise<Beat[]> => {
  if (featuredBeatsCache.has(count)) {
    return featuredBeatsCache.get(count)!;
  }

  const { data, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('is_featured', true)
    .limit(count);

  if (error) {
    console.error("Error fetching featured beats:", error);
    return [];
  }

  const beats = (data as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  featuredBeatsCache.set(count, beats);
  return beats;
};

// Function to fetch weekly picks
export const fetchWeeklyPicks = async (): Promise<Beat[]> => {
  const weeklyPicksCacheKey = 'weekly-picks';
  
  // Check if we have cached data that's still valid
  if (weeklyPicksCache.has(weeklyPicksCacheKey)) {
    const cached = weeklyPicksCache.get(weeklyPicksCacheKey)!;
    const now = Date.now();
    
    if (now - cached.timestamp < MAX_CACHE_AGE) {
      return cached.data;
    }
  }
  
  // If no valid cached data, fetch from database
  const { data: weeklyPicksData, error } = await supabase
    .from('beats')
    .select('*, producers(name, username, avatar_url), genres(name)')
    .eq('is_weekly_pick', true)
    .limit(6);
  
  if (error) {
    console.error('Error fetching weekly picks:', error);
    return [];
  }
  
  // Transform the data to our Beat type
  const weeklyPicks = (weeklyPicksData as SupabaseBeat[]).map(mapSupabaseBeatToBeat);
  
  // Cache the results
  weeklyPicksCache.set(weeklyPicksCacheKey, {
    data: weeklyPicks,
    timestamp: Date.now()
  });
  
  return weeklyPicks;
};

// Clear all caches
export const clearBeatsCache = (): void => {
  beatsByGenreCache.clear();
  randomBeatsCache.clear();
  beatCache.clear();
  featuredBeatsCache.clear();
  weeklyPicksCache.clear();
  trendingBeatsCache.clear();
  allBeatsCache.clear();
  newBeatsCache.clear();
  console.log('All beats caches cleared');
};
