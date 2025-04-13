
import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useBeats } from '@/hooks/useBeats';

export const usePurchasedBeats = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedBeats, setPurchasedBeats] = useState<Beat[]>([]);
  const beatsStore = useBeats();
  
  const fetchPurchasedBeats = useCallback(async () => {
    setIsLoading(true);
    // Get purchased beats from useBeats hook
    const beats = beatsStore.getUserPurchasedBeats();
    setPurchasedBeats(beats);
    setIsLoading(false);
  }, [beatsStore]);
  
  useEffect(() => {
    fetchPurchasedBeats();
  }, [fetchPurchasedBeats]);
  
  return {
    isLoading,
    purchasedBeats,
    fetchPurchasedBeats,
  };
};
