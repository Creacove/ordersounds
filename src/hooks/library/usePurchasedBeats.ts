import { useState, useEffect, useMemo } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Beat } from '@/types';

export function usePurchasedBeats() {
  const { getUserPurchasedBeats, fetchPurchasedBeats, isPurchased, isLoading } = useBeats();
  const { user } = useAuth();
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, { licenseType: string, purchaseDate: string }>>({});
  const [beatsLoaded, setBeatsLoaded] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const location = useLocation();
  
  // Enhanced real-time subscription for purchases
  useEffect(() => {
    if (!user) return;
    
    console.log('Setting up real-time subscription for purchases for user:', user.id);
    
    const channel = supabase
      .channel('purchased-beats-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time: New purchase detected:', payload);
          // Force immediate refresh of purchased beats
          refreshPurchasedBeats();
          
          // Show success message
          toast.success('New beat added to your library!');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Real-time: Order status updated:', payload);
          if (payload.new?.status === 'completed') {
            // Delay refresh slightly to ensure all related data is inserted
            setTimeout(() => {
              console.log('Order completed, refreshing library...');
              refreshPurchasedBeats();
            }, 1000);
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);
  
  // Use memoization to prevent unnecessary re-renders
  const purchasedBeats = useMemo(() => {
    if (!user || !beatsLoaded) return [];
    const beats = getUserPurchasedBeats();
    console.log('Purchased beats from getUserPurchasedBeats:', beats.length);
    return beats;
  }, [user, getUserPurchasedBeats, beatsLoaded, lastRefresh]);

  // Enhanced initial loading
  useEffect(() => {
    if (user) {
      console.log('Initial load of purchased beats for user:', user.id);
      
      const loadData = async () => {
        try {
          await fetchPurchasedBeats();
          setBeatsLoaded(true);
          console.log('Initial purchased beats loaded successfully');
        } catch (error) {
          console.error('Error in initial purchased beats load:', error);
          setBeatsLoaded(true); // Set to true even on error to prevent infinite loading
        }
      };
      
      loadData();
      
      // If we came from a purchase, force refresh after a short delay
      const fromPurchase = location.state?.fromPurchase || localStorage.getItem('purchaseSuccess') === 'true';
      if (fromPurchase) {
        console.log('Coming from a purchase, forcing refresh...');
        setTimeout(() => {
          refreshPurchasedBeats();
        }, 1500);
      }
    }
  }, [user, location.state, fetchPurchasedBeats]);

  // Load purchase details when beats are available
  useEffect(() => {
    if (user && beatsLoaded && purchasedBeats.length > 0) {
      fetchPurchaseDetails();
    }
  }, [user, beatsLoaded, purchasedBeats.length]);

  const fetchPurchaseDetails = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching purchase details for user:', user.id);
      const { data, error } = await supabase
        .from('user_purchased_beats')
        .select('beat_id, license_type, purchase_date')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Create a map of beat_id to license details
      const detailsMap: Record<string, { licenseType: string, purchaseDate: string }> = {};
      data.forEach(item => {
        detailsMap[item.beat_id] = {
          licenseType: item.license_type || 'basic',
          purchaseDate: item.purchase_date
        };
      });
      
      console.log('Purchase details fetched:', Object.keys(detailsMap).length, 'items');
      setPurchaseDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
    }
  };

  const refreshPurchasedBeats = async () => {
    if (isRefreshing) {
      console.log('Refresh already in progress, skipping...');
      return;
    }
    
    setIsRefreshing(true);
    try {
      console.log('Refreshing purchased beats...');
      
      // Force fetch fresh data
      await fetchPurchasedBeats();
      await fetchPurchaseDetails();
      
      // Update timestamp to trigger re-render
      setLastRefresh(Date.now());
      setBeatsLoaded(true);
      
      console.log('Library refresh completed successfully');
      toast.success('Your library has been refreshed');
    } catch (error) {
      console.error('Error refreshing library:', error);
      toast.error('Failed to refresh your library');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getDownloadUrl = async (beatId: string, fullTrackUrl: string) => {
    try {
      // Check if we already have the URL cached
      if (downloadUrls[beatId]) {
        return downloadUrls[beatId];
      }

      // Extract the file path from the full URL
      const filePath = fullTrackUrl.replace('https://uoezlwkxhbzajdivrlby.supabase.co/storage/v1/object/public/beats/', '');
      
      // Add loading toast
      toast.loading('Generating download link...');
      
      // Get a secure download URL that expires after some time
      const { data, error } = await supabase.storage.from('beats').createSignedUrl(filePath, 3600);

      if (error) {
        throw error;
      }

      // Cache the URL
      setDownloadUrls(prev => ({
        ...prev,
        [beatId]: data.signedUrl
      }));

      toast.dismiss();
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
      toast.dismiss();
      toast.error('Unable to generate download link');
      return null;
    }
  };

  const handleDownload = async (beat: Beat) => {
    try {
      // Only allow download if the beat is actually purchased
      if (!isPurchased(beat.id)) {
        toast.error('You need to purchase this beat first');
        return;
      }

      // Get the download URL
      const downloadUrl = await getDownloadUrl(beat.id, beat.full_track_url);
      
      if (!downloadUrl) {
        toast.error('Failed to generate download link');
        return;
      }

      // Create an invisible anchor and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Get the license type for this beat
      const license = purchaseDetails[beat.id]?.licenseType || 'basic';
      
      // Create a clean filename with license type included
      link.download = `${beat.title.replace(/\s+/g, '_')}_${license}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  return {
    purchasedBeats,
    isLoading,
    isRefreshing,
    beatsLoaded,
    purchaseDetails,
    refreshPurchasedBeats,
    handleDownload
  };
}
