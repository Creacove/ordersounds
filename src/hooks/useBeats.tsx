
import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { deleteBeat } from '@/lib/beatStorage';
import { toast } from 'sonner';
import { useIsMobile } from './use-mobile';
import { validateImageUrl } from '@/lib/storage';

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [favoriteBeats, setFavoriteBeats] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Fetch all beats
  const fetchBeats = useCallback(async () => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id, 
          title, 
          producer_id, 
          cover_image, 
          audio_preview,
          audio_file, 
          genre, 
          track_type, 
          bpm, 
          key,
          tags, 
          description, 
          upload_date,
          favorites_count,
          purchase_count,
          status,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
          users (
            id, full_name, stage_name
          )
        `)
        .eq('status', 'published')
        .order('upload_date', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedBeats = data.map(beat => {
        const userData = beat.users;
        const producerName = userData && userData.stage_name 
          ? userData.stage_name 
          : userData && userData.full_name 
            ? userData.full_name 
            : 'Unknown Producer';

        return {
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producerName,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          genre: beat.genre || '',
          track_type: beat.track_type || '',
          bpm: beat.bpm || 0,
          key: beat.key || '',
          tags: beat.tags || [],
          description: beat.description || '',
          created_at: beat.upload_date || new Date().toISOString(),
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: (beat.status as 'draft' | 'published') || 'published',
          is_featured: false, // This is set later for featured beats
          basic_license_price_local: beat.basic_license_price_local || 0,
          basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
          premium_license_price_local: beat.premium_license_price_local || 0,
          premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
          exclusive_license_price_local: beat.exclusive_license_price_local || 0,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
          custom_license_price_local: beat.custom_license_price_local || 0,
          custom_license_price_diaspora: beat.custom_license_price_diaspora || 0
        };
      });

      // Check if cover images are accessible and fix if possible
      const checkedBeats = await Promise.all(formattedBeats.map(async (beat) => {
        if (beat.cover_image_url) {
          const isValid = await validateImageUrl(beat.cover_image_url);
          if (!isValid) {
            // Try to fix broken image URLs by appending origin if it's a relative path
            if (beat.cover_image_url.startsWith('/')) {
              const baseUrl = window.location.origin;
              beat.cover_image_url = `${baseUrl}${beat.cover_image_url}`;
              console.log('Fixed relative cover image URL:', beat.cover_image_url);
            }
          }
        }
        return beat;
      }));

      setBeats(checkedBeats);
      
      // Fetch favorites separately
      await fetchUserFavorites();
      await fetchUserPurchases();

    } catch (error) {
      console.error('Error fetching beats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch user favorites
  const fetchUserFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteBeats([]);
      return;
    }

    try {
      // Check if user_favorites table exists
      const { data: tablesData } = await supabase
        .rpc('get_existing_tables');
      
      const userFavoritesTableExists = tablesData && 
        tablesData.some((table: string) => table === 'user_favorites');

      if (!userFavoritesTableExists) {
        console.log('user_favorites table does not exist, creating it');
        // Create the table if it doesn't exist
        await supabase.rpc('create_user_favorites_table');
      }

      // First try to query the user_favorites table directly
      const { data, error } = await supabase
        .from('user_favorites')
        .select('beat_id')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error fetching user favorites:', error);
        setFavoriteBeats([]);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const favoriteIds = data.map(fav => fav.beat_id);
        setFavoriteBeats(favoriteIds);
      } else {
        setFavoriteBeats([]);
      }
    } catch (error) {
      console.error('Error in fetchUserFavorites:', error);
      setFavoriteBeats([]);
    }
  }, [user]);

  // Fetch user purchases
  const fetchUserPurchases = useCallback(async () => {
    if (!user) {
      setPurchasedBeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      if (data && Array.isArray(data)) {
        const purchasedIds = data.map(purchase => purchase.beat_id);
        setPurchasedBeats(purchasedIds);
      }
    } catch (error) {
      console.error('Error fetching user purchases:', error);
    }
  }, [user]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (beatId: string) => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return false;
    }

    try {
      const isFav = favoriteBeats.includes(beatId);
      
      if (isFav) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('beat_id', beatId);
        
        // Try to decrement the favorites counter
        try {
          await supabase
            .rpc('decrement_favorites_count', { beat_id_param: beatId });
        } catch (error) {
          console.warn('Error decrementing favorites count:', error);
        }
        
        setFavoriteBeats(prev => prev.filter(id => id !== beatId));
        return false;
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert([{ user_id: user.id, beat_id: beatId }]);
          
        // Try to increment the favorites counter
        try {
          await supabase
            .rpc('increment_favorites_count', { beat_id_param: beatId });
        } catch (error) {
          console.warn('Error incrementing favorites count:', error);
        }
        
        setFavoriteBeats(prev => [...prev, beatId]);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
      return favoriteBeats.includes(beatId);
    }
  }, [user, favoriteBeats]);

  // Get beat by ID
  const getBeatById = useCallback((beatId: string) => {
    return beats.find(beat => beat.id === beatId) || null;
  }, [beats]);

  // Check if a beat is favorited
  const isFavorite = useCallback((beatId: string) => {
    return favoriteBeats.includes(beatId);
  }, [favoriteBeats]);

  // Check if a beat is purchased
  const isPurchased = useCallback((beatId: string) => {
    return purchasedBeats.includes(beatId);
  }, [purchasedBeats]);

  // Get trending beats
  const getTrendingBeats = useCallback(() => {
    const sorted = [...beats].sort((a, b) => b.favorites_count - a.favorites_count);
    return isMobile ? sorted.slice(0, 4) : sorted.slice(0, 8);
  }, [beats, isMobile]);

  // Get new beats
  const getNewBeats = useCallback(() => {
    const sorted = [...beats].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return isMobile ? sorted.slice(0, 4) : sorted.slice(0, 8);
  }, [beats, isMobile]);

  // Get random beats for weekly picks
  const getWeeklyPicks = useCallback(() => {
    const shuffled = [...beats].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, isMobile ? 4 : 8);
  }, [beats, isMobile]);

  // Get random featured beat
  const getFeaturedBeat = useCallback(() => {
    if (beats.length === 0) return null;
    
    const featuredBeats = beats.filter(beat => beat.cover_image_url);
    if (featuredBeats.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * featuredBeats.length);
    const featured = { ...featuredBeats[randomIndex] };
    featured.is_featured = true;
    return featured;
  }, [beats]);

  // Get all user favorite beats
  const getUserFavoriteBeats = useCallback(() => {
    return beats.filter(beat => favoriteBeats.includes(beat.id));
  }, [beats, favoriteBeats]);

  // Get all user purchased beats
  const getUserPurchasedBeats = useCallback(() => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  }, [beats, purchasedBeats]);

  // Delete a beat
  const handleDeleteBeat = useCallback(async (beatId: string) => {
    if (!user) {
      toast.error('You must be logged in to delete beats');
      return false;
    }
    
    try {
      const beat = getBeatById(beatId);
      if (!beat) {
        toast.error('Beat not found');
        return false;
      }
      
      // Check if user is the producer of this beat
      if (beat.producer_id !== user.id) {
        toast.error('You can only delete your own beats');
        return false;
      }
      
      const result = await deleteBeat(beatId);
      
      if (result.success) {
        // Remove from local state
        setBeats(prev => prev.filter(b => b.id !== beatId));
        toast.success('Beat deleted successfully');
        return true;
      } else {
        toast.error(result.error || 'Failed to delete beat');
        return false;
      }
    } catch (error) {
      console.error('Error deleting beat:', error);
      toast.error('An error occurred while deleting the beat');
      return false;
    }
  }, [user, getBeatById]);

  // Get producer beats
  const getProducerBeats = useCallback((producerId: string) => {
    return beats.filter(beat => beat.producer_id === producerId);
  }, [beats]);

  // Refetch beats data (used after operations that modify beats)
  const refetchBeats = useCallback(async () => {
    await fetchBeats();
  }, [fetchBeats]);

  // Fetch beats on initial load
  useEffect(() => {
    fetchBeats();
  }, [fetchBeats]);

  return {
    beats,
    isLoading,
    favoriteBeats,
    purchasedBeats,
    isFavorite,
    isPurchased,
    toggleFavorite,
    getBeatById,
    trendingBeats: getTrendingBeats(),
    newBeats: getNewBeats(),
    weeklyPicks: getWeeklyPicks(),
    featuredBeat: getFeaturedBeat(),
    getUserFavoriteBeats,
    getUserPurchasedBeats,
    getProducerBeats,
    deleteBeat: handleDeleteBeat,
    refetchBeats
  };
}
