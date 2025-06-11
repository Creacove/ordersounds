
import { useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletSync = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { user } = useAuth();

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null) => {
    // Check if user is authenticated first
    if (!user?.id) {
      console.log('Cannot sync wallet: User not authenticated');
      if (walletAddress) {
        toast.error('Please log in to sync your wallet address');
      }
      return false;
    }

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
        return false;
      }

      if (walletAddress) {
        toast.success('Wallet connected and synced');
      } else {
        toast.success('Wallet disconnected');
      }
      return true;
    } catch (error) {
      console.error('Error in wallet sync:', error);
      toast.error('Failed to sync wallet');
      return false;
    }
  }, [user?.id]);

  // Sync wallet connection state to database
  useEffect(() => {
    if (connected && publicKey) {
      syncWalletToDatabase(publicKey.toString());
    } else if (!connected) {
      // Only sync disconnection if user is authenticated
      if (user?.id) {
        syncWalletToDatabase(null);
      }
    }
  }, [connected, publicKey, user?.id, syncWalletToDatabase]);

  const disconnectAndSync = useCallback(async () => {
    try {
      await disconnect();
      if (user?.id) {
        await syncWalletToDatabase(null);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, syncWalletToDatabase, user?.id]);

  // Enhanced connection status with authentication check
  const isWalletSynced = connected && publicKey && user?.id;
  const needsAuth = connected && publicKey && !user?.id;

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    isWalletSynced,
    needsAuth,
    isConnected: connected,
    walletAddress: publicKey?.toString()
  };
};
