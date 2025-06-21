
import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Beat } from '@/types';
import { 
  fetchUserFavorites, 
  toggleFavoriteAPI,
  getUserFavoriteBeats as getUserFavoriteBeatsService
} from '@/services/beats';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [favoritesFetchInProgress, setFavoritesFetchInProgress] = useState(false);

  // Query for user favorites
  const { 
    data: userFavorites = [], 
    isLoading: isLoadingFavorites,
    refetch: refetchFavorites
  } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }
      
      const favorites = await fetchUserFavorites(user.id);
      const favoritesArray = Array.isArray(favorites) ? favorites : [];
      return favoritesArray;
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // Keep favorites fresh for 2 minutes
  });

  // Mutation for toggling favorites
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ beatId, wasFavorited }: { beatId: string; wasFavorited: boolean }) => {
      if (!user?.id) {
        throw new Error('Please log in to add favorites');
      }
      
      return await toggleFavoriteAPI(user.id, beatId, userFavorites);
    },
    onMutate: async ({ beatId, wasFavorited }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-favorites', user?.id] });

      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData(['user-favorites', user?.id]) as string[] || [];

      // Optimistically update
      const optimisticFavorites = wasFavorited
        ? previousFavorites.filter(id => id !== beatId)
        : [...previousFavorites, beatId];

      queryClient.setQueryData(['user-favorites', user?.id], optimisticFavorites);

      return { previousFavorites };
    },
    onSuccess: (updatedFavorites, { beatId, wasFavorited }) => {
      // Update with actual API response
      const favoritesArray = Array.isArray(updatedFavorites) ? updatedFavorites : [];
      queryClient.setQueryData(['user-favorites', user?.id], favoritesArray);
      
      // Show success feedback
      if (wasFavorited) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousFavorites) {
        queryClient.setQueryData(['user-favorites', user?.id], context.previousFavorites);
      }
      
      console.error('Error updating favorites:', error);
      toast.error('Failed to update favorites');
    },
  });

  const toggleFavorite = async (beatId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Please log in to add favorites');
      return false;
    }

    const wasFavorited = userFavorites.includes(beatId);
    
    try {
      const result = await toggleFavoriteMutation.mutateAsync({ beatId, wasFavorited });
      const favoritesArray = Array.isArray(result) ? result : [];
      return favoritesArray.includes(beatId);
    } catch (error) {
      return wasFavorited;
    }
  };

  // Memoize isFavorite function to prevent excessive calls
  const isFavorite = useCallback((beatId: string): boolean => {
    return userFavorites.includes(beatId);
  }, [userFavorites]);

  const getUserFavoriteBeats = useMemo(() => (beats: Beat[]): Beat[] => {
    if (!userFavorites || userFavorites.length === 0) {
      return [];
    }
    
    if (!beats || beats.length === 0) {
      return [];
    }
    
    return getUserFavoriteBeatsService(beats, userFavorites);
  }, [userFavorites]);

  const refreshUserFavorites = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    
    await refetchFavorites();
  }, [refetchFavorites, user?.id]);

  return {
    userFavorites,
    isLoadingFavorites,
    favoritesFetchInProgress,
    toggleFavorite,
    isFavorite,
    getUserFavoriteBeats,
    refreshUserFavorites
  };
}
