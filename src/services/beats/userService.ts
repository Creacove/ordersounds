import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { SupabaseBeat } from './types';
import { mapSupabaseBeatToBeat } from './utils';

export const fetchUserFavorites = async (userId: string): Promise<string[]> => {
  console.log('=== FETCH USER FAVORITES API ===');
  console.log('Fetching favorites for user ID:', userId);
  
  try {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('favorites')
      .eq('id', userId)
      .single();
    
    console.log('Supabase response - data:', userData);
    console.log('Supabase response - error:', userError);
    
    if (userError) {
      console.error('Supabase error fetching user favorites:', userError);
      return [];
    }
    
    if (!userData) {
      console.log('No user data found');
      return [];
    }
    
    console.log('Raw favorites from database:', userData.favorites);
    
    let favorites: string[] = [];
    
    if (userData.favorites) {
      try {
        if (Array.isArray(userData.favorites)) {
          // Handle direct array
          favorites = userData.favorites.filter(id => typeof id === 'string') as string[];
          console.log('Processed as direct array:', favorites);
        } else if (typeof userData.favorites === 'object') {
          // Handle object with nested values
          console.log('Processing as object:', userData.favorites);
          
          if (Array.isArray(userData.favorites)) {
            favorites = userData.favorites.filter(id => typeof id === 'string') as string[];
          } else {
            // Try to extract values from object
            const values = Object.values(userData.favorites || {});
            favorites = values.filter(id => typeof id === 'string') as string[];
          }
          
          console.log('Processed from object:', favorites);
        } else if (typeof userData.favorites === 'string') {
          // Handle string (possibly JSON)
          try {
            const parsed = JSON.parse(userData.favorites);
            if (Array.isArray(parsed)) {
              favorites = parsed.filter(id => typeof id === 'string') as string[];
            }
            console.log('Processed from JSON string:', favorites);
          } catch (parseError) {
            console.error('Failed to parse favorites string:', parseError);
          }
        }
      } catch (processingError) {
        console.error('Error processing favorites data:', processingError);
      }
    }
    
    console.log('Final processed favorites:', favorites);
    return favorites;
  } catch (error) {
    console.error('Error in fetchUserFavorites:', error);
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
  console.log('=== TOGGLE FAVORITE API ===');
  console.log('User ID:', userId);
  console.log('Beat ID:', beatId);
  console.log('Current favorites:', currentFavorites);
  
  try {
    const isFav = currentFavorites.includes(beatId);
    let updatedFavorites: string[];
    
    if (isFav) {
      updatedFavorites = currentFavorites.filter(id => id !== beatId);
      console.log('Removing from favorites, new array:', updatedFavorites);
    } else {
      updatedFavorites = [...currentFavorites, beatId];
      console.log('Adding to favorites, new array:', updatedFavorites);
    }
    
    console.log('Updating database with favorites:', updatedFavorites);
    
    const { error } = await supabase
      .from('users')
      .update({ favorites: updatedFavorites })
      .eq('id', userId);
    
    if (error) {
      console.error('Database update error:', error);
      throw error;
    }
    
    console.log('Successfully updated favorites in database');
    return updatedFavorites;
  } catch (error) {
    console.error('Error in toggleFavorite API:', error);
    throw error;
  }
};
