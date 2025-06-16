
import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Beat } from '@/types';
import { fetchPurchasedBeatsOptimized } from '@/services/library/purchasedBeatsService';

export function usePurchasedBeatsOptimized() {
  const { user } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});

  // Main purchased beats query with React Query caching
  const {
    data: purchasedData,
    isLoading,
    refetch,
    error
  } = useQuery({
    queryKey: ['purchased-beats', user?.id],
    queryFn: () => user ? fetchPurchasedBeatsOptimized(user.id) : Promise.resolve({ beats: [], purchaseDetails: {} }),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const purchasedBeats = useMemo(() => purchasedData?.beats || [], [purchasedData]);
  const purchaseDetails = useMemo(() => purchasedData?.purchaseDetails || {}, [purchasedData]);

  // Optimized real-time subscription
  useState(() => {
    if (!user) return;

    const channel = supabase
      .channel('purchased-beats-optimized')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Invalidate and refetch with React Query
          queryClient.invalidateQueries({ queryKey: ['purchased-beats', user.id] });
          toast.success('New beat added to your library!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  });

  const refreshPurchasedBeats = async () => {
    try {
      console.log('Refreshing purchased beats...');
      await refetch();
      toast.success('Your library has been refreshed');
    } catch (error) {
      console.error('Error refreshing library:', error);
      toast.error('Failed to refresh your library');
    }
  };

  const getDownloadUrl = async (beatId: string, fileUrl: string, fileType: 'track' | 'stems' = 'track') => {
    try {
      const cacheKey = `${beatId}-${fileType}`;
      if (downloadUrls[cacheKey]) {
        return downloadUrls[cacheKey];
      }

      const filePath = fileUrl.replace('https://uoezlwkxhbzajdivrlby.supabase.co/storage/v1/object/public/beats/', '');
      
      toast.loading(`Generating ${fileType} download link...`);
      
      const { data, error } = await supabase.storage.from('beats').createSignedUrl(filePath, 3600);

      if (error) throw error;

      setDownloadUrls(prev => ({
        ...prev,
        [cacheKey]: data.signedUrl
      }));

      toast.dismiss();
      return data.signedUrl;
    } catch (error) {
      console.error(`Error getting ${fileType} download URL:`, error);
      toast.dismiss();
      toast.error(`Unable to generate ${fileType} download link`);
      return null;
    }
  };

  const handleDownload = async (beat: Beat, downloadType: 'track' | 'stems' = 'track') => {
    try {
      if (downloadType === 'stems' && !beat.stems_url) {
        toast.error('Stems are not available for this beat');
        return;
      }

      const fileUrl = downloadType === 'stems' ? beat.stems_url! : beat.full_track_url;
      const downloadUrl = await getDownloadUrl(beat.id, fileUrl, downloadType);
      
      if (!downloadUrl) {
        toast.error(`Failed to generate ${downloadType} download link`);
        return;
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const license = purchaseDetails[beat.id]?.licenseType || 'basic';
      const fileExtension = downloadType === 'stems' ? 'zip' : 'mp3';
      const fileTypeSuffix = downloadType === 'stems' ? '_stems' : '';
      link.download = `${beat.title.replace(/\s+/g, '_')}_${license}${fileTypeSuffix}.${fileExtension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${downloadType === 'stems' ? 'Stems' : 'Track'} download started!`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return {
    purchasedBeats,
    isLoading,
    isRefreshing: false,
    beatsLoaded: !isLoading,
    purchaseDetails,
    refreshPurchasedBeats,
    handleDownload,
    error
  };
}
