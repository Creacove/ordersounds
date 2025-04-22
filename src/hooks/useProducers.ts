
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface Producer {
  id: string;
  stage_name: string | null;
  full_name: string;
  bio: string | null;
  profile_picture: string | null;
  follower_count: number;
  beatCount: number;
}

export function useProducers() {
  // Get all producers with improved performance
  const { 
    data: producers = [], 
    isLoading, 
    refetch, 
    isError,
    error 
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
              return { ...producer, beatCount: 0 };
            }

            return { 
              ...producer, 
              beatCount: count || 0
            };
          })
        );
        
        console.log(`Fetched ${producersWithBeats.length} producers`);
        return producersWithBeats as Producer[];
      } catch (error) {
        console.error("Error fetching producers:", error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnMount: false // Don't refetch automatically when component mounts
  });

  // Function to trigger a prefetch of producer data
  const prefetchProducers = () => {
    console.log("Prefetching producers data...");
    refetch();
  };

  return {
    producers,
    isLoading,
    isError,
    error,
    prefetchProducers
  };
}
