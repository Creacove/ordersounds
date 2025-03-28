import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle, Music, DownloadIcon, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/library/EmptyState';

export default function Library() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { getUserPurchasedBeats, fetchPurchasedBeats, isPurchased, isLoading } = useBeats();
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [purchasedBeats, setPurchasedBeats] = useState([]);
  const [downloadUrls, setDownloadUrls] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [purchaseDetails, setPurchaseDetails] = useState({});

  useEffect(() => {
    document.title = "Library | OrderSOUNDS";
    
    // Refresh purchased beats when library is loaded
    if (user) {
      fetchPurchasedBeats();
      setPurchasedBeats(getUserPurchasedBeats());
      fetchPurchaseDetails();
    }
    
    // Check if we're coming from a successful purchase
    const fromPurchase = location.state?.fromPurchase;
    if (fromPurchase) {
      setShowPurchaseSuccess(true);
      
      // Only show the success message once by replacing the current location state
      const currentPathname = location.pathname;
      navigate(currentPathname, { replace: true });
      
      // Show a welcome toast
      toast.success('Welcome to your library! You can now enjoy your beats.', {
        duration: 5000,
      });
      
      // Clear the success message after some time
      const timer = setTimeout(() => {
        setShowPurchaseSuccess(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location, user, fetchPurchasedBeats, navigate, getUserPurchasedBeats]);

  // Double check for pending orders that might need clearing
  useEffect(() => {
    const pendingOrderId = localStorage.getItem('pendingOrderId');
    const paystackReference = localStorage.getItem('paystackReference');
    
    if (pendingOrderId && paystackReference) {
      // Remove the pending order info
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      
      // Refresh purchased beats to ensure they show up
      if (user) {
        fetchPurchasedBeats();
        setPurchasedBeats(getUserPurchasedBeats());
      }
    }
  }, [user, fetchPurchasedBeats, getUserPurchasedBeats]);

  useEffect(() => {
    if (user) {
      setPurchasedBeats(getUserPurchasedBeats());
    }
  }, [user, getUserPurchasedBeats]);

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
      setPurchasedBeats(getUserPurchasedBeats());
      await fetchPurchaseDetails();
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
        toast.dismiss();
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
      
      toast.dismiss();
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.dismiss();
      toast.error('Failed to download file');
    }
  };

  if (!user) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-12 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your library</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access your purchased beats and playlists.
            </p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      {showPurchaseSuccess && (
        <div className="w-full bg-green-500 text-white py-3 px-4">
          <div className="container flex items-center justify-between">
            <p className="font-medium">🎉 Your purchase was successful! Your new beats are now in your library.</p>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-green-600"
              onClick={() => setShowPurchaseSuccess(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Your Library</h1>
        
        <div className="space-y-8">
          {/* Purchased Beats Section */}
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

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : purchasedBeats.length === 0 ? (
              <EmptyState
                icon={Music}
                title="No purchased beats yet"
                description="When you purchase beats, they will appear here for you to download."
                actionLabel="Browse Beats"
                actionHref="/"
              />
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
            )}
          </div>
          
          {/* Other library content */}
          <Outlet />
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
}
