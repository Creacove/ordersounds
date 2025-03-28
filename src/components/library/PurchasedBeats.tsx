
import React, { useState, useEffect, useMemo } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DownloadIcon, RefreshCw, Music, Play, Pause } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { usePlayer } from '@/context/PlayerContext';

export function PurchasedBeats() {
  const { getUserPurchasedBeats, fetchPurchasedBeats, isPurchased, isLoading } = useBeats();
  const { user } = useAuth();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const [downloadUrls, setDownloadUrls] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState({});
  const [beatsLoaded, setBeatsLoaded] = useState(false);
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Set up a subscription to real-time database changes for purchases
  useEffect(() => {
    if (!user) return;
    
    // Set up a subscription to purchased_beats for the current user
    const channel = supabase
      .channel('purchased-beats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New purchase detected in PurchasedBeats component:', payload);
          // When a new purchase is detected, refresh the purchased beats list
          refreshPurchasedBeats();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
  
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
      
      // If we came from a purchase, make sure to refresh the list
      const fromPurchase = location.state?.fromPurchase || localStorage.getItem('purchaseSuccess') === 'true';
      if (fromPurchase) {
        refreshPurchasedBeats();
      }
    }
  }, [user, location.state]);

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

  const handlePlayBeat = (beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        playBeat(null);
      } else {
        playBeat(beat);
      }
    } else {
      playBeat(beat);
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
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold">Your Purchased Beats</h2>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={refreshPurchasedBeats}
          disabled={isRefreshing}
          className="w-full xs:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              <span className="whitespace-nowrap">Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Refresh</span>
            </>
          )}
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {purchasedBeats.map((beat) => (
            <div key={beat.id} className="relative border rounded-lg overflow-hidden">
              <div className="flex items-center space-x-3 p-3">
                <div 
                  className="relative h-14 w-14 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
                  onClick={() => handlePlayBeat(beat)}
                >
                  <img
                    src={beat.cover_image_url}
                    alt={beat.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isPlaying && currentBeat?.id === beat.id ? (
                      <Pause className="h-5 w-5 text-white" />
                    ) : (
                      <Play className="h-5 w-5 ml-0.5 text-white" />
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm truncate">{beat.title}</h3>
                  <p className="text-xs text-muted-foreground">{beat.producer_name}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(beat)}
                  className="flex items-center gap-1"
                >
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-1 px-3 pb-2 text-xs text-muted-foreground flex justify-between">
                <span className="capitalize">{purchaseDetails[beat.id]?.licenseType || 'Basic'} License</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(beat)}
                  className="h-6 text-xs text-primary"
                >
                  <DownloadIcon className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
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
                    <div className="flex items-center space-x-3">
                      <div 
                        className="relative h-10 w-10 flex-shrink-0 rounded-md overflow-hidden cursor-pointer group"
                        onClick={() => handlePlayBeat(beat)}
                      >
                        <img
                          src={beat.cover_image_url}
                          alt={beat.title}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isPlaying && currentBeat?.id === beat.id ? (
                            <Pause className="h-4 w-4 text-white" />
                          ) : (
                            <Play className="h-4 w-4 ml-0.5 text-white" />
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">{beat.title}</div>
                      </div>
                    </div>
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
      )}
    </div>
  );
}
