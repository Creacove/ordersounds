import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SupabaseBeat {
  id: string;
  title: string;
  producer_id: string;
  users?: {
    full_name?: string | null;
    stage_name?: string | null;
  } | null;
  cover_image?: string | null;
  audio_preview?: string | null;
  audio_file?: string | null;
  basic_license_price_local?: number | null;
  basic_license_price_diaspora?: number | null;
  premium_license_price_local?: number | null;
  premium_license_price_diaspora?: number | null;
  exclusive_license_price_local?: number | null;
  exclusive_license_price_diaspora?: number | null;
  custom_license_price_local?: number | null;
  custom_license_price_diaspora?: number | null;
  genre?: string | null;
  track_type?: string | null;
  bpm?: number | null;
  tags?: string[] | null;
  description?: string | null;
  upload_date?: string | null;
  favorites_count?: number | null;
  purchase_count?: number | null;
  status?: string | null;
  key?: string | null;
  plays?: number | null;
}

const mapSupabaseBeatToBeat = (beat: SupabaseBeat): Beat => {
  const userData = beat.users;
  const producerName = userData && userData.stage_name ? userData.stage_name : 
                     userData && userData.full_name ? userData.full_name : 'Unknown Producer';
  
  const status = beat.status === 'published' ? 'published' : 'draft';
  
  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: producerName,
    cover_image_url: beat.cover_image || '',
    preview_url: beat.audio_preview || '',
    full_track_url: beat.audio_file || '',
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local || 0,
    premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
    exclusive_license_price_local: beat.exclusive_license_price_local || 0,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
    custom_license_price_local: beat.custom_license_price_local || 0,
    custom_license_price_diaspora: beat.custom_license_price_diaspora || 0,
    genre: beat.genre || '',
    track_type: beat.track_type || 'Beat',
    bpm: beat.bpm || 0,
    tags: beat.tags || [],
    description: beat.description,
    created_at: beat.upload_date || new Date().toISOString(),
    favorites_count: beat.favorites_count || 0,
    purchase_count: beat.purchase_count || 0,
    status: status,
    is_featured: false,
  };
};

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
      status
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

export const fetchTrendingBeats = async (limit = 5): Promise<Beat[]> => {
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
        basic_license_price_local,
        basic_license_price_diaspora,
        genre,
        track_type,
        bpm,
        tags,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .order('favorites_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error in fetchTrendingBeats:', error);
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

export const fetchRandomBeats = async (limit = 5): Promise<Beat[]> => {
  try {
    // Get a set of beats for weekly picks
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
        basic_license_price_local,
        basic_license_price_diaspora,
        genre,
        track_type,
        bpm,
        tags,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .limit(50); // Get a larger pool to select from

    if (error) {
      console.error('Error in fetchRandomBeats:', error);
      throw error;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      // Shuffle and take required number
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, limit).map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching random beats:', error);
    return [];
  }
};

export const fetchNewBeats = async (limit = 5): Promise<Beat[]> => {
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
        basic_license_price_local,
        basic_license_price_diaspora,
        genre,
        track_type,
        bpm,
        tags,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .order('upload_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error in fetchNewBeats:', error);
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

export const fetchPopularBeats = async (limit = 6): Promise<Beat[]> => {
  try {
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
        basic_license_price_local,
        basic_license_price_diaspora,
        genre,
        track_type,
        bpm,
        tags,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .order('purchase_count', { ascending: false });

    // Apply limit if specified
    if (limit > 0) {
      query = query.limit(limit);
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
    console.error('Error fetching popular beats:', error);
    return [];
  }
};

export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single();
    
    if (!userError && userData) {
      let favorites: string[] = [];
      
      if (userData.favorites) {
        if (Array.isArray(userData.favorites)) {
          favorites = userData.favorites as string[];
        } else if (typeof userData.favorites === 'object') {
          const favArray = Array.isArray(userData.favorites) 
            ? userData.favorites 
            : Object.values(userData.favorites || {});
          
          favorites = favArray.filter(id => typeof id === 'string') as string[];
        }
      }
      
      return favorites;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user favorites:', error);
    return [];
  }
};

export const fetchPurchasedBeats = async (userId: string): Promise<string[]> => {
  try {
    const { data: purchasedData, error: purchasedError } = await supabase
      .from('user_purchased_beats')
      .select('beat_id')
      .eq('user_id', userId);
    
    if (purchasedError) {
      console.error('Error fetching purchased beats:', purchasedError);
      return [];
    }
    
    if (purchasedData) {
      return purchasedData.map(item => item.beat_id);
    }
    return [];
  } catch (error) {
    console.error('Error in fetchPurchasedBeats:', error);
    return [];
  }
};

export const fetchPurchasedBeatDetails = async (beatIds: string[]): Promise<Beat[]> => {
  if (beatIds.length === 0) return [];
  
  try {
    const { data: beatsData, error: beatsError } = await createBasicBeatsQuery()
      .in('id', beatIds);
        
    if (beatsError) {
      console.error('Error fetching beat details for purchased beats:', beatsError);
      return [];
    } 
    
    if (beatsData) {
      return beatsData.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching purchased beat details:', error);
    return [];
  }
};

export const toggleFavoriteAPI = async (userId: string, beatId: string, currentFavorites: string[]): Promise<string[]> => {
  try {
    const isFav = currentFavorites.includes(beatId);
    let updatedFavorites: string[];
    
    if (isFav) {
      updatedFavorites = currentFavorites.filter(id => id !== beatId);
    } else {
      updatedFavorites = [...currentFavorites, beatId];
    }
    
    const { error } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    return updatedFavorites;
  } catch (error) {
    console.error('Error in toggleFavorite API:', error);
    throw error;
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

export const getProducerBeats = (beats: Beat[], producerId: string): Beat[] => {
  return beats.filter(beat => beat.producer_id === producerId);
};

export const getUserFavoriteBeats = (beats: Beat[], favoriteIds: string[]): Beat[] => {
  return beats.filter(beat => favoriteIds.includes(beat.id));
};
