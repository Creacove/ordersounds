
import { useState, useCallback } from 'react';
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
        console.log('No user ID available, skipping favorites fetch');
        return [];
      }
      
      console.log('Fetching favorites from API for user:', user.id);
      const favorites = await fetchUserFavorites(user.id);
      const favoritesArray = Array.isArray(favorites) ? favorites : [];
      console.log('Successfully fetched user favorites:', favoritesArray);
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
      
      console.log('Making API call to toggle favorite...', { beatId, wasFavorited });
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
      
      console.log('Updated favorites cache with new data');
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
    console.log('=== TOGGLE FAVORITE CALLED ===');
    console.log('Beat ID:', beatId);
    console.log('User:', user?.id);
    console.log('Current favorites before toggle:', userFavorites);

    if (!user?.id) {
      console.log('No user available for favorites');
      toast.error('Please log in to add favorites');
      return false;
    }

    const wasFavorited = userFavorites.includes(beatId);
    console.log('Was favorited:', wasFavorited);
    
    try {
      const result = await toggleFavoriteMutation.mutateAsync({ beatId, wasFavorited });
      const favoritesArray = Array.isArray(result) ? result : [];
      return favoritesArray.includes(beatId);
    } catch (error) {
      return wasFavorited;
    }
  };

  const isFavorite = (beatId: string): boolean => {
    const result = userFavorites.includes(beatId);
    console.log('Checking if beat is favorite:', beatId, result, 'Current favorites:', userFavorites);
    return result;
  };

  const getUserFavoriteBeats = (beats: Beat[]): Beat[] => {
    console.log('=== GET USER FAVORITE BEATS ===');
    console.log('Current beats array length:', beats.length);
    console.log('Current userFavorites:', userFavorites);
    
    if (!userFavorites || userFavorites.length === 0) {
      console.log('No favorites found, returning empty array');
      return [];
    }
    
    if (!beats || beats.length === 0) {
      console.log('No beats available yet, returning empty array');
      return [];
    }
    
    const favoriteBeats = getUserFavoriteBeatsService(beats, userFavorites);
    console.log('Favorite beats found:', favoriteBeats.length, favoriteBeats);
    return favoriteBeats;
  };

  const refreshUserFavorites = useCallback(async () => {
    console.log('=== REFRESH USER FAVORITES ===');
    console.log('User available:', !!user?.id);
    
    if (!user?.id) {
      console.log('No user available, cannot refresh favorites');
      return;
    }
    
    console.log('Starting refresh with force refresh = true');
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
