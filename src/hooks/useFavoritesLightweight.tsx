
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFavoritesLightweight() {
  const { user } = useAuth();
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user favorites only when needed
  const loadFavorites = useCallback(async () => {
    if (!user || isLoading) return;

    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('users')
        .select('favorites')
        .eq('id', user.id)
        .single();

      if (data?.favorites) {
        // Properly handle Json[] to string[] conversion
        const favoritesArray = Array.isArray(data.favorites) 
          ? data.favorites.filter((item): item is string => typeof item === 'string')
          : [];
        setUserFavorites(favoritesArray);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoading]);

  // Load favorites on mount, but don't block anything
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setUserFavorites([]);
    }
  }, [user, loadFavorites]);

  const isFavorite = useCallback((beatId: string): boolean => {
    return userFavorites.includes(beatId);
  }, [userFavorites]);

  const toggleFavorite = useCallback(async (beatId: string) => {
    if (!user) return;

    const currentlyFavorite = isFavorite(beatId);
    
    // Optimistic update
    setUserFavorites(prev => 
      currentlyFavorite 
        ? prev.filter(id => id !== beatId)
        : [...prev, beatId]
    );

    try {
      if (currentlyFavorite) {
        await supabase.rpc('remove_favorite', {
          user_id_param: user.id,
          beat_id_param: beatId
        });
      } else {
        await supabase.rpc('add_favorite', {
          user_id_param: user.id,
          beat_id_param: beatId
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update
      setUserFavorites(prev => 
        currentlyFavorite 
          ? [...prev, beatId]
          : prev.filter(id => id !== beatId)
      );
      toast.error('Failed to update favorite');
    }
  }, [user, isFavorite]);

  return {
    userFavorites,
    isFavorite,
    toggleFavorite,
    isLoading
  };
}
