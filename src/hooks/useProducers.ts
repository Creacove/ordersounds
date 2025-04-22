
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
        
        // Fetch producers and beat counts in a single query using SQL joins
        // This reduces multiple separate API calls to just one
        const { data: producersWithBeats, error } = await supabase
          .from('users')
          .select(`
            id, 
            stage_name, 
            full_name, 
            bio, 
            profile_picture, 
            follower_count,
            (SELECT count(*) FROM beats WHERE beats.producer_id = users.id) AS beatCount
          `)
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });

        if (error) throw error;
        
        if (!producersWithBeats) return [];

        console.log(`Fetched ${producersWithBeats.length} producers`);
        
        // Transform the results to match our Producer interface
        return producersWithBeats.map(producer => ({
          ...producer,
          beatCount: producer.beatCount ? parseInt(producer.beatCount) : 0
        })) as Producer[];
        
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
