import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Default fallback beats for when we can't load from the API
export const fallbackBeats: Beat[] = [
  {
    id: "fallback-1",
    title: "Demo Beat 1",
    producer_id: "demo-producer",
    producer_name: "Demo Producer",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 5000,
    basic_license_price_diaspora: 15,
    genre: "Afrobeat",
    bpm: 120,
    status: "published",
    is_featured: false,
    created_at: new Date().toISOString(),
    tags: ["demo", "afrobeat"],
    track_type: "Beat",
    favorites_count: 0,
    purchase_count: 0
  },
  {
    id: "fallback-2",
    title: "Demo Beat 2",
    producer_id: "demo-producer",
    producer_name: "Demo Producer",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 7000,
    basic_license_price_diaspora: 20,
    genre: "Hip Hop",
    bpm: 90,
    status: "published",
    is_featured: false,
    created_at: new Date().toISOString(),
    tags: ["demo", "hiphop"],
    track_type: "Beat",
    favorites_count: 0,
    purchase_count: 0
  }
];

// Optimized fetchAllBeats with optional parameters to optimize query size
export const fetchAllBeats = async (options = { includeDetails: true }): Promise<Beat[]> => {
  try {
    // Build query based on options to optimize payload size
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
        ${options.includeDetails ? 'audio_file,' : ''}
        basic_license_price_local,
        basic_license_price_diaspora,
        ${options.includeDetails ? `
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
        ${options.includeDetails ? 'description,' : ''}
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published');
    
    // Single fetch with no retry logic - we rely on the extended timeout in the enhancedFetch
    const { data: beatsData, error: beatsError } = await query;
    
    if (beatsError) {
      throw beatsError;
    }

    if (beatsData) {
      return beatsData.map(beat => {
        const userData = beat.users;
        const producerName = userData && userData.stage_name ? userData.stage_name : 
                           userData && userData.full_name ? userData.full_name : 'Unknown Producer';
        
        const status = beat.status === 'published' ? 'published' : 'draft';
        
        return {
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producerName,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          basic_license_price_local: beat.basic_license_price_local,
          basic_license_price_diaspora: beat.basic_license_price_diaspora,
          premium_license_price_local: beat.premium_license_price_local,
          premium_license_price_diaspora: beat.premium_license_price_diaspora,
          exclusive_license_price_local: beat.exclusive_license_price_local,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
          custom_license_price_local: beat.custom_license_price_local,
          custom_license_price_diaspora: beat.custom_license_price_diaspora,
          genre: beat.genre,
          track_type: beat.track_type || 'Beat',
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: status,
          is_featured: false,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching all beats:', error);
    throw error;
  }
};

export const fetchTrendingBeats = async (): Promise<Beat[]> => {
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
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .order('favorites_count', { ascending: false })
      .limit(30);
    
    if (error) {
      throw error;
    }

    if (data) {
      return data.map(beat => {
        const userData = beat.users;
        const producerName = userData && userData.stage_name ? userData.stage_name : 
                           userData && userData.full_name ? userData.full_name : 'Unknown Producer';
        
        return {
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producerName,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          basic_license_price_local: beat.basic_license_price_local,
          basic_license_price_diaspora: beat.basic_license_price_diaspora,
          premium_license_price_local: beat.premium_license_price_local,
          premium_license_price_diaspora: beat.premium_license_price_diaspora,
          exclusive_license_price_local: beat.exclusive_license_price_local,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
          custom_license_price_local: beat.custom_license_price_local,
          custom_license_price_diaspora: beat.custom_license_price_diaspora,
          genre: beat.genre,
          track_type: beat.track_type || 'Beat',
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: beat.status === 'published' ? 'published' : 'draft',
          is_featured: false,
        };
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching trending beats:', error);
    return [];
  }
};

export const fetchPopularBeats = async (): Promise<Beat[]> => {
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
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .eq('status', 'published')
      .order('purchase_count', { ascending: false })
      .limit(6);
    
    if (error) {
      throw error;
    }

    if (data) {
      return data.map(beat => {
        const userData = beat.users;
        const producerName = userData && userData.stage_name ? userData.stage_name : 
                           userData && userData.full_name ? userData.full_name : 'Unknown Producer';
        
        return {
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producerName,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          basic_license_price_local: beat.basic_license_price_local,
          basic_license_price_diaspora: beat.basic_license_price_diaspora,
          premium_license_price_local: beat.premium_license_price_local,
          premium_license_price_diaspora: beat.premium_license_price_diaspora,
          exclusive_license_price_local: beat.exclusive_license_price_local,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
          custom_license_price_local: beat.custom_license_price_local,
          custom_license_price_diaspora: beat.custom_license_price_diaspora,
          genre: beat.genre,
          track_type: beat.track_type || 'Beat',
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: beat.status === 'published' ? 'published' : 'draft',
          is_featured: false,
        };
      });
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
    const { data: beatsData, error: beatsError } = await supabase
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
        tags,
        description,
        upload_date,
        favorites_count,
        purchase_count,
        status
      `)
      .in('id', beatIds);
        
    if (beatsError) {
      console.error('Error fetching beat details for purchased beats:', beatsError);
      return [];
    } 
    
    if (beatsData) {
      return beatsData.map(beat => {
        const userData = beat.users;
        const producerName = userData && userData.stage_name ? userData.stage_name : 
                          userData && userData.full_name ? userData.full_name : 'Unknown Producer';
        
        return {
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producerName,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          basic_license_price_local: beat.basic_license_price_local,
          basic_license_price_diaspora: beat.basic_license_price_diaspora,
          premium_license_price_local: beat.premium_license_price_local,
          premium_license_price_diaspora: beat.premium_license_price_diaspora,
          exclusive_license_price_local: beat.exclusive_license_price_local,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
          custom_license_price_local: beat.custom_license_price_local,
          custom_license_price_diaspora: beat.custom_license_price_diaspora,
          genre: beat.genre,
          track_type: beat.track_type || 'Beat',
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: beat.status === 'published' ? 'published' : 'draft',
          is_featured: false,
        };
      });
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
      // Remove from favorites
      updatedFavorites = currentFavorites.filter(id => id !== beatId);
    } else {
      // Add to favorites
      updatedFavorites = [...currentFavorites, beatId];
    }
    
    // Update in the database
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
      const userData = data.users;
      const producerName = userData && userData.stage_name ? userData.stage_name : 
                         userData && userData.full_name ? userData.full_name : 'Unknown Producer';
      
      return {
        id: data.id,
        title: data.title,
        producer_id: data.producer_id,
        producer_name: producerName,
        cover_image_url: data.cover_image,
        preview_url: data.audio_preview,
        full_track_url: data.audio_file,
        basic_license_price_local: data.basic_license_price_local,
        basic_license_price_diaspora: data.basic_license_price_diaspora,
        premium_license_price_local: data.premium_license_price_local,
        premium_license_price_diaspora: data.premium_license_price_diaspora,
        exclusive_license_price_local: data.exclusive_license_price_local,
        exclusive_license_price_diaspora: data.exclusive_license_price_diaspora,
        custom_license_price_local: data.custom_license_price_local,
        custom_license_price_diaspora: data.custom_license_price_diaspora,
        genre: data.genre,
        track_type: data.track_type || 'Beat',
        bpm: data.bpm,
        key: data.key,
        tags: data.tags || [],
        description: data.description,
        created_at: data.upload_date,
        favorites_count: data.favorites_count || 0,
        purchase_count: data.purchase_count || 0,
        plays: data.plays || 0,
        status: data.status === 'published' ? 'published' : 'draft',
        is_featured: false,
      };
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
