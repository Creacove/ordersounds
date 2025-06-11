
import { useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletSync = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { user } = useAuth();

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null) => {
    if (!user?.id) return;

    try {
      console.log(`Syncing wallet address to database: ${walletAddress || 'null'}`);
      
      const { error } = await supabase
        .from('users')
        .update({ 
          wallet_address: walletAddress 
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error syncing wallet to database:', error);
        toast.error('Failed to sync wallet address');
        return;
      }

      if (walletAddress) {
        toast.success('Wallet connected and synced');
      } else {
        toast.success('Wallet disconnected');
      }
    } catch (error) {
      console.error('Error in wallet sync:', error);
      toast.error('Failed to sync wallet');
    }
  }, [user?.id]);

  // Sync wallet connection state to database
  useEffect(() => {
    if (!user?.id) return;

    if (connected && publicKey) {
      syncWalletToDatabase(publicKey.toString());
    } else {
      syncWalletToDatabase(null);
    }
  }, [connected, publicKey, user?.id, syncWalletToDatabase]);

  const disconnectAndSync = useCallback(async () => {
    try {
      await disconnect();
      await syncWalletToDatabase(null);
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, syncWalletToDatabase]);

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    isWalletSynced: connected && publicKey && user?.id
  };
};
