
import { useEffect, useState } from "react";
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
        created_at: beat.created_at,
        is_featured: beat.is_featured || false,
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
        status: beat.status
      }));
      
      setBeats(beatsWithProducerNames);
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

      if (error) throw error;

      const favoriteIds = data.map(fav => fav.beat_id);
      setFavoriteBeats(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const fetchPurchasedBeats = async () => {
    if (!user) {
      setPurchasedBeats([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('beat_id')
        .eq('buyer_id', user.id);

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

  return {
    beats,
    isLoading,
    favoriteBeats,
    purchasedBeats,
    isFavorite,
    isPurchased,
    refetchBeats
  };
}
