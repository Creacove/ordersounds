
import React, { useState, useEffect, useMemo } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { DownloadIcon, RefreshCw, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function PurchasedBeats() {
  const { getUserPurchasedBeats, fetchPurchasedBeats, isPurchased, isLoading } = useBeats();
  const { user } = useAuth();
  const [downloadUrls, setDownloadUrls] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState({});
  const [beatsLoaded, setBeatsLoaded] = useState(false);
  
  // Use memoization to prevent unnecessary re-renders
  const purchasedBeats = useMemo(() => {
    if (!user || !beatsLoaded) return [];
    return getUserPurchasedBeats();
  }, [user, getUserPurchasedBeats, beatsLoaded]);

  // Split initial loading into separate effects for better performance
  useEffect(() => {
    // Only set the flag to indicate beats are loaded
    if (user) {
      setBeatsLoaded(true);
    }
  }, [user]);

  // Load purchase details separately from beats to improve performance
  useEffect(() => {
    if (user && beatsLoaded && purchasedBeats.length > 0) {
      fetchPurchaseDetails();
    }
  }, [user, beatsLoaded, purchasedBeats]);

  const fetchPurchaseDetails = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_purchased_beats')
        .select('beat_id, license_type, purchase_date')
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Create a map of beat_id to license details
      const detailsMap = {};
      data.forEach(item => {
        detailsMap[item.beat_id] = {
          licenseType: item.license_type || 'basic',
          purchaseDate: item.purchase_date
        };
      });
      
      setPurchaseDetails(detailsMap);
    } catch (error) {
      console.error('Error fetching purchase details:', error);
    }
  };

  const refreshPurchasedBeats = async () => {
    setIsRefreshing(true);
    try {
      await fetchPurchasedBeats();
      await fetchPurchaseDetails();
      setBeatsLoaded(true);
      toast.success('Your library has been refreshed');
    } catch (error) {
      console.error('Error refreshing library:', error);
      toast.error('Failed to refresh your library');
    } finally {
      setIsRefreshing(false);
    }
  };

  const getDownloadUrl = async (beatId, fullTrackUrl) => {
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

  const handleDownload = async (beat) => {
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

  // Show a loading skeleton while initial data is being loaded
  if (isLoading || !beatsLoaded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Purchased Beats</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!purchasedBeats || purchasedBeats.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No purchased beats yet"
        description="When you purchase beats, they will appear here for you to download."
        actionLabel="Browse Beats"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Your Purchased Beats</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshPurchasedBeats}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Beat</TableHead>
              <TableHead>Producer</TableHead>
              <TableHead>License</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {purchasedBeats.map((beat) => (
              <TableRow key={beat.id}>
                <TableCell>
                  <BeatListItem beat={beat} />
                </TableCell>
                <TableCell>{beat.producer_name}</TableCell>
                <TableCell className="capitalize">
                  {purchaseDetails[beat.id]?.licenseType || 'Basic'} License
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(beat)}
                    className="flex items-center gap-1"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
