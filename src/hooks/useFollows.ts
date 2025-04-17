
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Beat } from '@/types';
import { toast } from 'sonner';

export function useFollows() {
  const { user } = useAuth();
  
  const useRecommendedBeats = () => {
    return useQuery({
      queryKey: ['recommendedBeats', user?.id],
      queryFn: async (): Promise<Beat[]> => {
        if (!user) {
          return [];
        }

        try {
          // First try to get data from edge function
          const { data: { beats = [] } = {}, error } = await supabase.functions.invoke('get-recommended-beats', {
            method: 'GET',
          });
          
          if (error) {
            console.error('Error fetching recommendations from edge function:', error);
            throw new Error(error.message);
          }
          
          if (Array.isArray(beats) && beats.length > 0) {
            return beats;
          }
          
          // Fallback: If edge function returned empty or failed, try direct query
          // with a simpler select to reduce timeout risk
          const { data: directBeats, error: directError } = await supabase
            .from('beats')
            .select(`
              id, 
              title, 
              cover_image,
              audio_preview,
              audio_file,
              basic_license_price_local,
              basic_license_price_diaspora,
              producer_id,
              genre,
              bpm,
              status,
              track_type,
              upload_date
            `)
            .order('upload_date', { ascending: false })
            .limit(6);
            
          if (directError) {
            console.error('Error fetching direct recommendations:', directError);
            return [];
          }
          
          return directBeats || [];
        } catch (error) {
          console.error('Failed to fetch recommended beats:', error);
          // Return empty array instead of throwing to prevent UI crashes
          return [];
        }
      },
      enabled: !!user,
      staleTime: 10 * 60 * 1000, // 10 minutes
      gcTime: 15 * 60 * 1000, // 15 minutes
      retry: 1 // Only retry once to reduce server load
    });
  };

  // Hook to check if user is following a producer - using react-query
  const useFollowStatus = (producerId: string) => {
    return useQuery({
      queryKey: ['followStatus', user?.id, producerId],
      queryFn: async () => {
        return isFollowing(producerId);
      },
      enabled: !!user && !!producerId,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Function to follow a producer
  const followProducer = async (producerId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to follow producers');
      return false;
    }

    try {
      // Check if already following
      const { data: existingFollow, error: checkError } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followee_id', producerId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking follow status:', checkError);
        toast.error('Failed to check follow status');
        return false;
      }

      // If already following, return true
      if (existingFollow) {
        return true;
      }

      // Insert new follow relationship
      const { error } = await supabase
        .from('followers')
        .insert({
          follower_id: user.id,
          followee_id: producerId,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error following producer:', error);
        toast.error('Failed to follow producer');
        return false;
      }

      toast.success('Successfully followed producer');
      return true;
    } catch (error) {
      console.error('Error in followProducer:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Function to unfollow a producer
  const unfollowProducer = async (producerId: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to unfollow producers');
      return false;
    }

    try {
      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', producerId);

      if (error) {
        console.error('Error unfollowing producer:', error);
        toast.error('Failed to unfollow producer');
        return false;
      }

      toast.success('Successfully unfollowed producer');
      return true;
    } catch (error) {
      console.error('Error in unfollowProducer:', error);
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Toggle follow status function
  const toggleFollow = async (producerId: string, currentlyFollowing: boolean): Promise<boolean> => {
    return currentlyFollowing 
      ? unfollowProducer(producerId) 
      : followProducer(producerId);
  };

  // Function to check if user is following a producer
  const isFollowing = async (producerId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('followee_id', producerId)
        .maybeSingle(); // Change to maybeSingle to avoid error when not found

      if (error) {
        console.error('Error checking follow status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFollowing:', error);
      return false;
    }
  };

  // Function to get all producers a user is following
  const getFollowedProducers = async (): Promise<any[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('followers')
        .select(`
          followee_id,
          users!followers_followee_id_fkey (
            id,
            full_name,
            stage_name,
            avatar_url
          )
        `)
        .eq('follower_id', user.id);

      if (error) {
        console.error('Error fetching followed producers:', error);
        return [];
      }

      return data?.map(item => item.users) || [];
    } catch (error) {
      console.error('Error in getFollowedProducers:', error);
      return [];
    }
  };

  // Function to get follower count for a producer
  const getFollowerCount = async (producerId: string): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followee_id', producerId);

      if (error) {
        console.error('Error getting follower count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getFollowerCount:', error);
      return 0;
    }
  };

  return {
    useRecommendedBeats,
    useFollowStatus,
    followProducer,
    unfollowProducer,
    toggleFollow,
    isFollowing,
    getFollowedProducers,
    getFollowerCount
  };
}
