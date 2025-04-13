
import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useBeats } from '@/hooks/useBeats';
import { toast } from 'sonner';

interface PurchaseDetail {
  purchaseDate: string;
  licenseType: string;
}

export const usePurchasedBeats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [beatsLoaded, setBeatsLoaded] = useState(false);
  const [purchasedBeats, setPurchasedBeats] = useState<Beat[]>([]);
  const [purchaseDetails, setPurchaseDetails] = useState<Record<string, PurchaseDetail>>({});
  const beatsStore = useBeats();
  
  const fetchPurchasedBeats = useCallback(async () => {
    setIsLoading(true);
    // Get purchased beats from useBeats hook
    const beats = beatsStore.getUserPurchasedBeats();
    
    // Simulate purchase details retrieval
    const details: Record<string, PurchaseDetail> = {};
    beats.forEach(beat => {
      details[beat.id] = {
        purchaseDate: new Date().toISOString(),
        licenseType: 'Basic License'
      };
    });
    
    setPurchasedBeats(beats);
    setPurchaseDetails(details);
    setBeatsLoaded(true);
    setIsLoading(false);
  }, [beatsStore]);
  
  const refreshPurchasedBeats = useCallback(async () => {
    setIsRefreshing(true);
    await beatsStore.fetchPurchasedBeats();
    await fetchPurchasedBeats();
    toast.success('Your purchased beats have been refreshed');
    setIsRefreshing(false);
  }, [beatsStore, fetchPurchasedBeats]);
  
  const handleDownload = useCallback((beatId: string) => {
    // This would be where download logic would be implemented
    const beat = purchasedBeats.find(b => b.id === beatId);
    if (!beat) return;
    
    // Get the URL of the full track
    const url = beat.full_track_url;
    if (!url) {
      toast.error('Download link not available');
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${beat.title}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${beat.title}`);
  }, [purchasedBeats]);
  
  useEffect(() => {
    fetchPurchasedBeats();
  }, [fetchPurchasedBeats]);
  
  return {
    isLoading,
    isRefreshing,
    beatsLoaded,
    purchasedBeats,
    purchaseDetails,
    fetchPurchasedBeats,
    refreshPurchasedBeats,
    handleDownload
  };
};
