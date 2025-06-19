
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminStats {
  totalBeats: number;
  trendingCount: number;
  featuredCount: number;
  weeklyPicksCount: number;
  publishedCount: number;
}

export function useAdminOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Fetch current beats statistics
  const fetchBeatStats = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('beats')
        .select('id, is_trending, is_featured, is_weekly_pick, status')
        .eq('status', 'published');
      
      if (error) throw error;
      
      const totalBeats = data?.length || 0;
      const trendingCount = data?.filter(beat => beat.is_trending).length || 0;
      const featuredCount = data?.filter(beat => beat.is_featured).length || 0;
      const weeklyPicksCount = data?.filter(beat => beat.is_weekly_pick).length || 0;
      
      setStats({
        totalBeats,
        trendingCount,
        featuredCount,
        weeklyPicksCount,
        publishedCount: totalBeats
      });
      
      return { totalBeats, trendingCount, featuredCount, weeklyPicksCount, publishedCount: totalBeats };
    } catch (error: any) {
      console.error('Error fetching beat stats:', error);
      toast.error('Failed to fetch beat statistics');
      return null;
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
    refreshWeeklyPicks
  };
}
