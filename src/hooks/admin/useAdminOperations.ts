import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminStats {
  totalBeats: number;
  trendingCount: number;
  featuredCount: number;
  weeklyPicksCount: number;
  publishedCount: number;
  currentProducerOfWeek?: {
    id: string;
    name: string;
    stageName?: string;
    profilePicture?: string;
    followerCount: number;
  } | null;
}

export function useAdminOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Fetch current beats statistics and producer of the week
  const fetchBeatStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch beats data
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select('id, is_trending, is_featured, is_weekly_pick, status')
        .eq('status', 'published');
      
      if (beatsError) throw beatsError;
      
      // Fetch current producer of the week
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select('id, full_name, stage_name, profile_picture, follower_count')
        .eq('is_producer_of_week', true)
        .eq('role', 'producer')
        .maybeSingle();
      
      if (producerError) {
        console.error('Error fetching producer of the week:', producerError);
      }
      
      const totalBeats = beatsData?.length || 0;
      const trendingCount = beatsData?.filter(beat => beat.is_trending).length || 0;
      const featuredCount = beatsData?.filter(beat => beat.is_featured).length || 0;
      const weeklyPicksCount = beatsData?.filter(beat => beat.is_weekly_pick).length || 0;
      
      const currentProducerOfWeek = producerData ? {
        id: producerData.id,
        name: producerData.full_name,
        stageName: producerData.stage_name,
        profilePicture: producerData.profile_picture,
        followerCount: producerData.follower_count || 0
      } : null;
      
      setStats({
        totalBeats,
        trendingCount,
        featuredCount,
        weeklyPicksCount,
        publishedCount: totalBeats,
        currentProducerOfWeek
      });
      
      return { 
        totalBeats, 
        trendingCount, 
        featuredCount, 
        weeklyPicksCount, 
        publishedCount: totalBeats,
        currentProducerOfWeek
      };
    } catch (error: any) {
      console.error('Error fetching beat stats:', error);
      toast.error('Failed to fetch beat statistics');
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set a specific producer as producer of the week
  const setProducerOfWeek = async (producerId: string) => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'set_producer_of_week',
          producerId: producerId
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully set ${data.producer_name} as producer of the week`);
        // Refresh stats after successful update
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error setting producer of the week:', error);
      toast.error(`Failed to set producer of the week: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh trending beats via edge function
  const refreshTrendingBeats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_trending_beats',
          count: 5 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beats as trending`);
        // Refresh stats after successful update
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing trending beats:', error);
      toast.error(`Failed to refresh trending beats: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh featured beats via edge function
  const refreshFeaturedBeats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_featured_beats',
          count: 1 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beat as featured`);
        // Refresh stats after successful update
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing featured beats:', error);
      toast.error(`Failed to refresh featured beats: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh weekly picks via edge function
  const refreshWeeklyPicks = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { 
          operation: 'refresh_weekly_picks',
          count: 6 
        }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success(`Successfully updated ${data.updated_count} beats as weekly picks`);
        // Refresh stats after successful update
        await fetchBeatStats();
        return true;
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error refreshing weekly picks:', error);
      toast.error(`Failed to refresh weekly picks: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    stats,
    isLoading,
    fetchBeatStats,
    refreshTrendingBeats,
    refreshFeaturedBeats,
    refreshWeeklyPicks,
    setProducerOfWeek
  };
}
