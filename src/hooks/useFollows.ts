
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useFollows() {
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const queryClient = useQueryClient();
  
  // Get follow status for a specific producer
  const useFollowStatus = (producerId: string | undefined) => {
    return useQuery({
      queryKey: ['followStatus', producerId],
      queryFn: async () => {
        if (!producerId) return false;
        
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session || !session.session) return false;
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-follow-status`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ producerId }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to get follow status');
          }
          
          const data = await response.json();
          return data.isFollowing;
        } catch (error) {
          console.error('Error getting follow status:', error);
          return false;
        }
      },
      enabled: !!producerId,
    });
  };
  
  // Follow a producer
  const followProducer = async (producerId: string) => {
    if (!producerId) return;
    
    setIsFollowLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        toast.error("You must be logged in to follow a producer");
        return false;
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/follow-producer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ producerId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to follow producer');
      }
      
      // Invalidate follow status query after successful follow
      queryClient.invalidateQueries({ queryKey: ['followStatus', producerId] });
      // Update the producer's follower count in the cache
      queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      
      return true;
    } catch (error) {
      console.error('Error following producer:', error);
      toast.error(error.message || 'Failed to follow producer');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  // Unfollow a producer
  const unfollowProducer = async (producerId: string) => {
    if (!producerId) return;
    
    setIsFollowLoading(true);
    
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session || !session.session) {
        toast.error("You must be logged in to unfollow a producer");
        return false;
      }
      
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/unfollow-producer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ producerId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to unfollow producer');
      }
      
      // Invalidate follow status query after successful unfollow
      queryClient.invalidateQueries({ queryKey: ['followStatus', producerId] });
      // Update the producer's follower count in the cache
      queryClient.invalidateQueries({ queryKey: ['producer', producerId] });
      
      return true;
    } catch (error) {
      console.error('Error unfollowing producer:', error);
      toast.error(error.message || 'Failed to unfollow producer');
      return false;
    } finally {
      setIsFollowLoading(false);
    }
  };
  
  // Toggle follow status (follow or unfollow)
  const toggleFollow = async (producerId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return await unfollowProducer(producerId);
    } else {
      return await followProducer(producerId);
    }
  };
  
  // Mutation for toggling follow status
  const useToggleFollowMutation = () => {
    return useMutation({
      mutationFn: ({ producerId, isFollowing }: { producerId: string; isFollowing: boolean }) => 
        toggleFollow(producerId, isFollowing),
      onSuccess: () => {
        // You can handle any additional success logic here
      },
    });
  };
  
  // Get recommended beats from followed producers
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommendedBeats'],
      queryFn: async () => {
        try {
          const { data: session } = await supabase.auth.getSession();
          if (!session || !session.session) return [];
          
          const response = await fetch(`${supabase.supabaseUrl}/functions/v1/get-recommended-beats`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            throw new Error('Failed to get recommended beats');
          }
          
          const data = await response.json();
          return data.beats;
        } catch (error) {
          console.error('Error getting recommended beats:', error);
          return [];
        }
      },
    });
  };
  
  return {
    isFollowLoading,
    useFollowStatus,
    followProducer,
    unfollowProducer,
    toggleFollow,
    useToggleFollowMutation,
    useRecommendedBeats,
  };
}
