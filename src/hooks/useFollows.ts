
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { SupabaseBeat, isSupabaseBeatArray } from '@/services/beats/types';

export const useFollows = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper to fetch recommended beats from producers the user follows
  const fetchRecommendedBeats = async (): Promise<SupabaseBeat[]> => {
    if (!user) {
      return []; // Return empty array if no user
    }

    try {
      // Call the Edge Function to get recommended beats
      const { data, error } = await supabase.functions.invoke('get-recommended-beats', {
        body: { userId: user.id },
      });

      if (error) {
        console.error('Error fetching recommended beats:', error);
        throw error;
      }

      // Ensure data is an array (recommended beats) and validate it
      return isSupabaseBeatArray(data) ? data : [];
    } catch (error) {
      console.error('Error fetching recommended beats:', error);
      return [];
    }
  };

  // Wrapped query hook for recommended beats with proper typing
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommendedBeats', user?.id],
      queryFn: fetchRecommendedBeats,
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      gcTime: 10 * 60 * 1000,
    });
  };

  // Function to follow a producer
  const followProducer = async (producerId: string) => {
    if (!user) {
      toast.error('You must be logged in to follow producers');
      throw new Error('User not authenticated');
    }

    if (user.id === producerId) {
      toast.error('You cannot follow yourself');
      throw new Error('Cannot follow self');
    }

    try {
      const { error } = await supabase.rpc('follow_producer', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });

      if (error) throw error;

      // Update the producer's follower count in the cache
      queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      queryClient.invalidateQueries({ queryKey: ['followStatus', user.id, producerId] });
      queryClient.invalidateQueries({ queryKey: ['followedProducers', user.id] });
      
      return true;
    } catch (error) {
      console.error('Error following producer:', error);
      throw error;
    }
  };

  // Function to unfollow a producer
  const unfollowProducer = async (producerId: string) => {
    if (!user) {
      toast.error('You must be logged in to unfollow producers');
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase.rpc('unfollow_producer', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });

      if (error) throw error;

      // Update the producer's follower count in the cache
      queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      queryClient.invalidateQueries({ queryKey: ['followStatus', user.id, producerId] });
      queryClient.invalidateQueries({ queryKey: ['followedProducers', user.id] });
      
      return true;
    } catch (error) {
      console.error('Error unfollowing producer:', error);
      throw error;
    }
  };

  // Check if the current user follows a specific producer
  const checkFollowStatus = async (producerId: string): Promise<boolean> => {
    if (!user || !producerId) return false;

    try {
      const { data, error } = await supabase.rpc('check_follow_status', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });

      if (error) throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };

  // Hook to check if the current user follows a specific producer
  const useFollowStatus = (producerId: string | undefined) => {
    return useQuery({
      queryKey: ['followStatus', user?.id, producerId],
      queryFn: () => checkFollowStatus(producerId || ''),
      enabled: !!user && !!producerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Hook to follow a producer
  const useFollowProducer = () => {
    return useMutation({
      mutationFn: followProducer,
      onSuccess: () => {
        toast.success('Producer followed successfully');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to follow producer');
      }
    });
  };

  // Hook to unfollow a producer
  const useUnfollowProducer = () => {
    return useMutation({
      mutationFn: unfollowProducer,
      onSuccess: () => {
        toast.success('Producer unfollowed');
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to unfollow producer');
      }
    });
  };

  // Fetch all producers that the current user follows
  const fetchFollowedProducers = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          followee_id,
          users:followee_id (
            id,
            full_name,
            stage_name,
            profile_picture,
            bio,
            follower_count
          )
        `)
        .eq('follower_id', user.id);

      if (error) throw error;
      
      return data?.map(item => item.users) || [];
    } catch (error) {
      console.error('Error fetching followed producers:', error);
      return [];
    }
  };

  // Hook to get all producers that the current user follows
  const useFollowedProducers = () => {
    return useQuery({
      queryKey: ['followedProducers', user?.id],
      queryFn: fetchFollowedProducers,
      enabled: !!user,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Add a toggleFollow function that decides whether to follow or unfollow
  const toggleFollow = async (producerId: string, isCurrentlyFollowing: boolean): Promise<boolean> => {
    if (isCurrentlyFollowing) {
      await unfollowProducer(producerId);
      return false;
    } else {
      await followProducer(producerId);
      return true;
    }
  };

  return {
    useFollowStatus,
    useFollowProducer,
    useUnfollowProducer,
    useFollowedProducers,
    useRecommendedBeats,
    toggleFollow, // Export the new function
  };
};
