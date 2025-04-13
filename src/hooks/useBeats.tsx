
import { useEffect, useState, useMemo } from "react";
import { Beat } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteBeats, setFavoriteBeats] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const { user } = useAuth();

  // Derived beat collections
  const trendingBeats = useMemo(() => {
    return [...beats].sort((a, b) => (b.plays || 0) - (a.plays || 0));
  }, [beats]);

  const newBeats = useMemo(() => {
    return [...beats].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [beats]);

  const weeklyPicks = useMemo(() => {
    // Randomly select some beats for weekly picks
    const shuffled = [...beats].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [beats]);

  const featuredBeat = useMemo(() => {
    return beats.find(beat => beat.is_featured) || (beats.length > 0 ? beats[0] : null);
  }, [beats]);

  const fetchBeats = async () => {
    setIsLoading(true);
    try {
      // Fetch all beats from the database
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          users:producer_id (full_name, stage_name)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const beatsWithProducerNames = data.map(beat => ({
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
        cover_image_url: beat.cover_image,
        preview_url: beat.audio_preview,
        full_track_url: beat.audio_file,
        genre: beat.genre,
        track_type: beat.track_type,
        bpm: beat.bpm,
        key: beat.key,
        tags: beat.tags || [],
        description: beat.description || '',
        created_at: beat.created_at || beat.upload_date,
        is_featured: Boolean(beat.is_featured) || false,
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        plays: beat.plays || 0,
        basic_license_price_local: beat.basic_license_price_local || 0,
        basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
        premium_license_price_local: beat.premium_license_price_local || 0,
        premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
        exclusive_license_price_local: beat.exclusive_license_price_local || 0,
        exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
        custom_license_price_local: beat.custom_license_price_local || 0,
        custom_license_price_diaspora: beat.custom_license_price_diaspora || 0,
        status: beat.status as "draft" | "published"
      }));
      
      setBeats(beatsWithProducerNames as Beat[]);
    } catch (error) {
      console.error('Error fetching beats:', error);
      toast.error('Failed to load beats');
    } finally {
      setIsLoading(false);
    }
  };
  
  const refetchBeats = () => {
    fetchBeats();
  };

  const fetchUserFavorites = async () => {
    if (!user) {
      setFavoriteBeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('beat_id')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error in favorites table query:', error);
        throw error;
      }

      if (data) {
        const favoriteIds = data.map(fav => fav.beat_id);
        setFavoriteBeats(favoriteIds);
      }
    } catch (error) {
      // Try alternative approach if the favorites table doesn't exist
      console.warn('Falling back to alternative favorites fetching method');
      try {
        const { data, error } = await supabase
          .from('user_favorites')
          .select('beat_id')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        if (data) {
          const favoriteIds = data.map(fav => fav.beat_id);
          setFavoriteBeats(favoriteIds);
        }
      } catch (altError) {
        console.error('Error fetching favorites (alternative method):', altError);
      }
    }
  };

  const fetchPurchasedBeats = async () => {
    if (!user) {
      setPurchasedBeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const purchasedIds = data.map(purchase => purchase.beat_id);
      setPurchasedBeats(purchasedIds);
    } catch (error) {
      console.error('Error fetching purchased beats:', error);
    }
  };

  useEffect(() => {
    fetchBeats();
    fetchUserFavorites();
    fetchPurchasedBeats();
  }, [user]);

  // Helper functions for state checks
  const isFavorite = (beatId: string) => favoriteBeats.includes(beatId);
  const isPurchased = (beatId: string) => purchasedBeats.includes(beatId);

  // Toggle favorite function
  const toggleFavorite = async (beatId: string) => {
    if (!user) {
      toast.error('Please log in to add favorites');
      return false;
    }

    const isBeatFavorite = isFavorite(beatId);

    try {
      if (isBeatFavorite) {
        // Remove from favorites
        await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('beat_id', beatId);
        
        setFavoriteBeats(prevFavorites => 
          prevFavorites.filter(id => id !== beatId)
        );
        
        // Update beat's favorites count
        await supabase.rpc("increment_counter" as any, {
          p_table_name: "beats",
          p_column_name: "favorites_count",
          p_id: beatId,
          p_increment: -1
        });
        
        // Update local beats state
        setBeats(prevBeats => prevBeats.map(beat => 
          beat.id === beatId 
            ? { ...beat, favorites_count: Math.max(0, (beat.favorites_count || 1) - 1) } 
            : beat
        ));
        
        return false;
      } else {
        // Add to favorites
        await supabase
          .from('favorites')
          .insert({ user_id: user.id, beat_id: beatId });
        
        setFavoriteBeats(prevFavorites => [...prevFavorites, beatId]);
        
        // Update beat's favorites count
        await supabase.rpc("increment_counter" as any, {
          p_table_name: "beats",
          p_column_name: "favorites_count",
          p_id: beatId,
          p_increment: 1
        });
        
        // Update local beats state
        setBeats(prevBeats => prevBeats.map(beat => 
          beat.id === beatId 
            ? { ...beat, favorites_count: (beat.favorites_count || 0) + 1 } 
            : beat
        ));
        
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
      return isBeatFavorite;
    }
  };

  // Get beat by ID helper function
  const getBeatById = async (id: string) => {
    const cachedBeat = beats.find(beat => beat.id === id);
    if (cachedBeat) return cachedBeat;

    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          *,
          users:producer_id (full_name, stage_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      const beat = {
        id: data.id,
        title: data.title,
        producer_id: data.producer_id,
        producer_name: data.users?.stage_name || data.users?.full_name || 'Unknown Producer',
        cover_image_url: data.cover_image,
        preview_url: data.audio_preview,
        full_track_url: data.audio_file,
        genre: data.genre,
        track_type: data.track_type,
        bpm: data.bpm,
        key: data.key,
        tags: data.tags || [],
        description: data.description || '',
        created_at: data.created_at || data.upload_date,
        is_featured: Boolean(data.is_featured) || false,
        favorites_count: data.favorites_count || 0,
        purchase_count: data.purchase_count || 0,
        plays: data.plays || 0,
        basic_license_price_local: data.basic_license_price_local || 0,
        basic_license_price_diaspora: data.basic_license_price_diaspora || 0,
        premium_license_price_local: data.premium_license_price_local || 0,
        premium_license_price_diaspora: data.premium_license_price_diaspora || 0,
        exclusive_license_price_local: data.exclusive_license_price_local || 0,
        exclusive_license_price_diaspora: data.exclusive_license_price_diaspora || 0,
        custom_license_price_local: data.custom_license_price_local || 0,
        custom_license_price_diaspora: data.custom_license_price_diaspora || 0,
        status: data.status as "draft" | "published"
      };

      return beat as Beat;
    } catch (error) {
      console.error('Error fetching beat by id:', error);
      return null;
    }
  };

  // Helper function for producer's beats
  const getProducerBeats = () => {
    if (!user) return [];
    return beats.filter(beat => beat.producer_id === user.id);
  };

  // Helper function for getting user's favorite beats
  const getUserFavoriteBeats = () => {
    return beats.filter(beat => favoriteBeats.includes(beat.id));
  };

  // Helper function for getting user's purchased beats
  const getUserPurchasedBeats = () => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  return {
    beats,
    isLoading,
    favoriteBeats,
    purchasedBeats,
    isFavorite,
    isPurchased,
    refetchBeats,
    toggleFavorite,
    getBeatById,
    trendingBeats,
    newBeats,
    weeklyPicks,
    featuredBeat,
    fetchPurchasedBeats,
    getUserFavoriteBeats,
    getUserPurchasedBeats,
    getProducerBeats,
    fetchTrendingBeats: refetchBeats // Alias for backward compatibility
  };
}
