
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Beat } from '@/types';
import { mapSupabaseBeats } from '@/lib/supabase';
import { toast } from 'sonner';

export function useFollows() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Get recommendations from followed producers
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommended-beats'],
      queryFn: async () => {
        if (!user) return [];
        
        try {
          const token = await supabase.auth.getSession()
            .then(({ data }) => data.session?.access_token);
          
          if (!token) {
            console.error('No access token available');
            return [];
          }
          
          const response = await fetch(
            'https://uoezlwkxhbzajdivrlby.functions.supabase.co/get-recommended-beats',
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error fetching recommended beats:', errorText);
            return [];
          }
          
          const data = await response.json();
          return mapSupabaseBeats(data.beats || []);
        } catch (error) {
          console.error('Error in recommended beats:', error);
          return [];
        }
      },
      enabled: !!user,
    });
  };
  
  // Follow a producer
  const followProducer = async (producerId: string) => {
    if (!user) {
      toast.error('You must be logged in to follow producers');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.rpc('follow_producer', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });
      
      if (error) throw error;
      
      toast.success('Producer followed successfully');
      return true;
    } catch (error: any) {
      console.error('Error following producer:', error);
      
      if (error.message.includes('Already following')) {
        toast.info('You are already following this producer');
      } else {
        toast.error('Failed to follow producer');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Unfollow a producer
  const unfollowProducer = async (producerId: string) => {
    if (!user) {
      toast.error('You must be logged in to unfollow producers');
      return false;
    }
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.rpc('unfollow_producer', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });
      
      if (error) throw error;
      
      toast.success('Producer unfollowed successfully');
      return true;
    } catch (error: any) {
      console.error('Error unfollowing producer:', error);
      toast.error('Failed to unfollow producer');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check if the user is following a producer
  const isFollowing = async (producerId: string) => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase.rpc('check_follow_status', {
        p_follower_id: user.id,
        p_followee_id: producerId
      });
      
      if (error) throw error;
      
      return data || false;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  };
  
  // Get all producers the user is following
  const getFollowedProducers = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('followers')
        .select('followee_id')
        .eq('follower_id', user.id);
      
      if (error) throw error;
      
      return data.map(follow => follow.followee_id);
    } catch (error) {
      console.error('Error getting followed producers:', error);
      return [];
    }
  };
  
  // Get the follower count for a producer
  const getFollowerCount = async (producerId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('follower_count')
        .eq('id', producerId)
        .single();
      
      if (error) throw error;
      
      return data.follower_count || 0;
    } catch (error) {
      console.error('Error getting follower count:', error);
      return 0;
    }
  };
  
  // Added two new functions needed by FollowButton
  // Check follow status as a React Query
  const useFollowStatus = (producerId: string) => {
    return useQuery({
      queryKey: ['follow-status', producerId],
      queryFn: () => isFollowing(producerId),
      enabled: !!user && !!producerId,
    });
  };
  
  // Toggle follow status
  const toggleFollow = async (producerId: string, isCurrentlyFollowing: boolean) => {
    if (isCurrentlyFollowing) {
      return unfollowProducer(producerId);
    } else {
      return followProducer(producerId);
    }
  };
  
  return {
    useRecommendedBeats,
    followProducer,
    unfollowProducer,
    isFollowing,
    getFollowedProducers,
    getFollowerCount,
    isLoading,
    useFollowStatus,
    toggleFollow
  };
}
