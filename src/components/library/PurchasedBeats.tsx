
import React, { useState, useEffect } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { DownloadIcon, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export function PurchasedBeats() {
  const { getUserPurchasedBeats, fetchPurchasedBeats, isPurchased, isLoading } = useBeats();
  const { user } = useAuth();
  const [purchasedBeats, setPurchasedBeats] = useState([]);
  const [downloadUrls, setDownloadUrls] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      // Set the purchased beats from the context
      setPurchasedBeats(getUserPurchasedBeats());
    }
  }, [user, getUserPurchasedBeats]);

  const refreshPurchasedBeats = async () => {
    setIsRefreshing(true);
    try {
      await fetchPurchasedBeats();
      setPurchasedBeats(getUserPurchasedBeats());
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

      // Get a secure download URL that expires after some time
      // This uses the original full track URL from Supabase Storage
      const { data, error } = await supabase.storage.from('beats').createSignedUrl(
        // Extract the path from the full URL - adjust this based on your storage structure
        fullTrackUrl.replace('https://uoezlwkxhbzajdivrlby.supabase.co/storage/v1/object/public/beats/', ''), 
        3600 // URL expires in 1 hour
      );

      if (error) {
        throw error;
      }

      // Cache the URL
      setDownloadUrls(prev => ({
        ...prev,
        [beatId]: data.signedUrl
      }));

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting download URL:', error);
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

      toast.loading('Preparing your download...');
      
      // Get the download URL
      const downloadUrl = await getDownloadUrl(beat.id, beat.full_track_url);
      
      if (!downloadUrl) {
        toast.error('Failed to generate download link');
        return;
      }

      // Create an invisible anchor and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${beat.title.replace(/\s+/g, '_')}_full.mp3`; // Create a clean filename
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.dismiss();
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  if (isLoading) {
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
                <TableCell>Basic License</TableCell>
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
