
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { fetchUserFavorites, toggleFavoriteAPI } from '@/services/beats';
import { toast } from 'sonner';

export function useFavorites() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: userFavorites = [], isLoading } = useQuery({
    queryKey: ['user-favorites', user?.id],
    queryFn: () => user?.id ? fetchUserFavorites(user.id) : [],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ beatId, currentFavorites }: { 
      beatId: string; 
      currentFavorites: string[] 
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return toggleFavoriteAPI(user.id, beatId, currentFavorites);
    },
    onMutate: async ({ beatId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-favorites', user?.id] });
      
      // Snapshot previous value
      const previousFavorites = queryClient.getQueryData(['user-favorites', user?.id]) as string[] || [];
      
      // Optimistically update
      const wasFavorited = previousFavorites.includes(beatId);
      const optimisticFavorites = wasFavorited
        ? previousFavorites.filter(id => id !== beatId)
        : [...previousFavorites, beatId];
      
      queryClient.setQueryData(['user-favorites', user?.id], optimisticFavorites);
      
      // Show immediate feedback
      toast.success(wasFavorited ? 'Removed from favorites' : 'Added to favorites');
      
      return { previousFavorites };
    },
    onError: (err, variables, context) => {
      // Revert on error
      if (context?.previousFavorites) {
        queryClient.setQueryData(['user-favorites', user?.id], context.previousFavorites);
      }
      toast.error('Failed to update favorites');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['user-favorites', user?.id] });
    },
  });

  const toggleFavorite = useCallback(async (beatId: string): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Please log in to add favorites');
      return false;
    }

    try {
      await toggleFavoriteMutation.mutateAsync({ 
        beatId, 
        currentFavorites: userFavorites 
      });
      return !userFavorites.includes(beatId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return userFavorites.includes(beatId);
    }
  }, [user?.id, userFavorites, toggleFavoriteMutation]);

  const isFavorite = useCallback((beatId: string): boolean => {
    return userFavorites.includes(beatId);
  }, [userFavorites]);

  return {
    userFavorites,
    isLoading,
    toggleFavorite,
    isFavorite,
  };
}
