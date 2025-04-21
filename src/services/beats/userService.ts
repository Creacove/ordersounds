
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';

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
