
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export const useFollows = () => {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const userId = auth?.user?.id;

  // Check if a user is following a producer
  const useFollowStatus = (producerId: string) => {
    return useQuery({
      queryKey: ['follow-status', producerId],
      queryFn: async () => {
        if (!userId) return false;

        try {
          const { data, error } = await supabase.rpc('is_following', {
            follower_id: userId,
            following_id: producerId
          });

          if (error) throw error;
          return !!data;
        } catch (error) {
          console.error('Follow status error:', error);
          return false;
        }
      },
      enabled: !!userId && !!producerId
    });
  };

  // Follow producer mutation
  const useFollowProducer = () => {
    return useMutation({
      mutationFn: async (producerId: string) => {
        if (!userId) throw new Error('User must be logged in to follow');
        
        const { data, error } = await supabase
          .rpc('follow_producer', {
            follower_id: userId,
            producer_id: producerId
          });
          
        if (error) throw error;
        return true;
      },
      onSuccess: (_, producerId) => {
        queryClient.invalidateQueries({ queryKey: ['follow-status', producerId] });
        queryClient.invalidateQueries({ queryKey: ['followed-producers'] });
      }
    });
  };

  // Unfollow producer mutation
  const useUnfollowProducer = () => {
    return useMutation({
      mutationFn: async (producerId: string) => {
        if (!userId) throw new Error('User must be logged in to unfollow');
        
        const { data, error } = await supabase
          .rpc('unfollow_producer', {
            follower_id: userId,
            producer_id: producerId
          });
          
        if (error) throw error;
        return false;
      },
      onSuccess: (_, producerId) => {
        queryClient.invalidateQueries({ queryKey: ['follow-status', producerId] });
        queryClient.invalidateQueries({ queryKey: ['followed-producers'] });
      }
    });
  };

  // Get list of producers the user follows
  const useFollowedProducers = () => {
    return useQuery({
      queryKey: ['followed-producers'],
      queryFn: async () => {
        if (!userId) return [];

        try {
          const { data, error } = await supabase
            .from('follows')
            .select('following_id, users!follows_following_id_fkey(id, full_name, stage_name, profile_picture)')
            .eq('follower_id', userId);

          if (error) throw error;
          
          return data.map(item => ({
            id: item.following_id,
            name: item.users?.stage_name || item.users?.full_name || 'Unknown Producer',
            avatar_url: item.users?.profile_picture || null
          }));
        } catch (error) {
          console.error('Fetch followed producers error:', error);
          return [];
        }
      },
      enabled: !!userId
    });
  };

  // Get recommended beats based on followed producers
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommended-beats'],
      queryFn: async () => {
        if (!userId) return [];
        
        try {
          const { data, error } = await supabase.functions.invoke('get-recommended-beats', {
            body: { userId }
          });
          
          if (error) throw error;
          return data || [];
        } catch (error) {
          console.error('Fetch recommended beats error:', error);
          return [];
        }
      },
      enabled: !!userId
    });
  };

  // Toggle follow status
  const toggleFollow = async (producerId: string, isCurrentlyFollowing: boolean) => {
    if (!userId) {
      toast.error("Please sign in to follow producers");
      return isCurrentlyFollowing;
    }
    
    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        const { error } = await supabase
          .rpc('unfollow_producer', {
            follower_id: userId,
            producer_id: producerId
          });
          
        if (error) throw error;
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['follow-status', producerId] });
        queryClient.invalidateQueries({ queryKey: ['followed-producers'] });
        return false;
      } else {
        // Follow
        const { error } = await supabase
          .rpc('follow_producer', {
            follower_id: userId,
            producer_id: producerId
          });
          
        if (error) throw error;
        
        // Invalidate queries
        queryClient.invalidateQueries({ queryKey: ['follow-status', producerId] });
        queryClient.invalidateQueries({ queryKey: ['followed-producers'] });
        return true;
      }
    } catch (error) {
      console.error('Toggle follow error:', error);
      toast.error("Failed to update follow status");
      return isCurrentlyFollowing;
    }
  };

  return {
    useFollowStatus,
    useFollowProducer,
    useUnfollowProducer,
    useFollowedProducers,
    useRecommendedBeats,
    toggleFollow
  };
};
