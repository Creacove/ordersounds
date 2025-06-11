
import { useEffect, useCallback, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletSync = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { user, forceUserDataRefresh } = useAuth();
  const syncInProgress = useRef(false);
  const lastSyncedWallet = useRef<string | null>(null);

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null) => {
    // Prevent concurrent syncs
    if (syncInProgress.current) {
      console.log('Wallet sync already in progress, skipping...');
      return false;
    }

    // Check if user is authenticated first
    if (!user?.id) {
      console.log('Cannot sync wallet: User not authenticated');
      if (walletAddress) {
        toast.error('Please log in to sync your wallet address');
      }
      return false;
    }

    // Don't sync if it's the same wallet as last time
    if (lastSyncedWallet.current === walletAddress) {
      console.log('Wallet address unchanged, skipping sync');
      return true;
    }

    syncInProgress.current = true;

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

      // Update last synced wallet
      lastSyncedWallet.current = walletAddress;

      // Force refresh user data to get the updated wallet address
      await forceUserDataRefresh();

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
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, forceUserDataRefresh]);

  // Sync wallet connection state to database
  useEffect(() => {
    // Don't sync if sync is already in progress
    if (syncInProgress.current) {
      return;
    }

    if (connected && publicKey) {
      const connectedWalletAddress = publicKey.toString();
      // Only sync if the connected wallet is different from stored wallet
      if (user?.wallet_address !== connectedWalletAddress) {
        console.log('Wallet connected, syncing to database...');
        syncWalletToDatabase(connectedWalletAddress);
      } else {
        console.log('Wallet already synced, no action needed');
        lastSyncedWallet.current = connectedWalletAddress;
      }
    } else if (!connected && user?.wallet_address && lastSyncedWallet.current) {
      // Only sync disconnection if user is authenticated and has a stored wallet
      console.log('Wallet disconnected, syncing to database...');
      syncWalletToDatabase(null);
    }
  }, [connected, publicKey, user?.id, user?.wallet_address, syncWalletToDatabase]);

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

  // Enhanced connection status with proper database comparison
  const connectedWalletAddress = publicKey?.toString();
  const storedWalletAddress = user?.wallet_address;
  
  // Wallet is synced if:
  // 1. User is authenticated
  // 2. Wallet is connected 
  // 3. Connected wallet matches stored wallet in database
  const isWalletSynced = connected && publicKey && user?.id && 
                        connectedWalletAddress === storedWalletAddress;
  
  // User needs auth if wallet is connected but no user is logged in
  const needsAuth = connected && publicKey && !user?.id;
  
  // Wallet mismatch if connected wallet differs from stored wallet
  const walletMismatch = connected && publicKey && user?.id && 
                        storedWalletAddress && 
                        connectedWalletAddress !== storedWalletAddress;

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    walletAddress: connectedWalletAddress,
    storedWalletAddress
  };
};
