
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Producer {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  stage_name?: string | null;
  full_name: string;
  bio?: string | null;
  profile_picture?: string | null;
  follower_count: number;
  beatCount: number;
}

export const useProducers = () => {
  const queryClient = useQueryClient();
  
  // Fetch all producers - this is the main query that will be shared across components
  const { 
    data: producers = [], 
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      try {
        console.log("Fetching producers data...");
        // First, get all producers from the users table
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });

        if (error) throw error;

        if (!producersData) return []; 

        // For each producer, get their beat count in parallel
        const producersWithBeats = await Promise.all(
          producersData.map(async (producer) => {
            const { count, error: beatError } = await supabase
              .from('beats')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', producer.id);

            if (beatError) {
              console.error('Error getting beat count:', beatError);
              return { 
                ...producer,
                beatCount: 0,
                name: producer.stage_name || producer.full_name,
                avatar: producer.profile_picture || `/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png`,
                verified: true
              };
            }

            return { 
              ...producer, 
              beatCount: count || 0,
              name: producer.stage_name || producer.full_name,
              avatar: producer.profile_picture || `/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png`,
              verified: true
            };
          })
        );
        
        console.log(`Fetched ${producersWithBeats.length} producers`);
        return producersWithBeats;
      } catch (error) {
        console.error("Error fetching producers:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnMount: false // Don't refetch automatically when component mounts
  });

  // Get top producers sorted by follower count
  const topProducers = producers.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0)).slice(0, 10);

  // Function to prefetch producers
  const prefetchProducers = async () => {
    console.log("Prefetching producers data...");
    return queryClient.prefetchQuery({
      queryKey: ['producers'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });
        
        if (error) {
          console.error('Error prefetching producers:', error);
          return [];
        }
        
        return data.map(producer => ({
          id: producer.id,
          name: producer.stage_name || producer.full_name,
          avatar: producer.profile_picture || `/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png`,
          verified: true,
          stage_name: producer.stage_name,
          full_name: producer.full_name,
          bio: producer.bio,
          profile_picture: producer.profile_picture,
          follower_count: producer.follower_count || 0,
          beatCount: 0
        }));
      },
      staleTime: 5 * 60 * 1000 // Keep data fresh for 5 minutes
    });
  };

  return {
    producers,
    topProducers,
    isLoading,
    isError,
    error,
    refetch,
    prefetchProducers
  };
};
