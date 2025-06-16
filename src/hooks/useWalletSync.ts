
import { useEffect, useCallback, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useWalletSync = () => {
  const { publicKey, connected, disconnect } = useWallet();
  const { user, forceUserDataRefresh } = useAuth();
  const syncInProgress = useRef(false);
  const lastSyncedWallet = useRef<string | null>(null);
  const lastSyncAttempt = useRef<number>(0);
  const syncCooldownMs = 2000;
  
  // Add state for better tracking
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null): Promise<boolean> => {
    console.log('🔄 syncWalletToDatabase called with:', { 
      walletAddress, 
      userId: user?.id,
      userWalletInContext: user?.wallet_address 
    });
    
    // Prevent concurrent syncs
    if (syncInProgress.current) {
      console.log('⏸️ Wallet sync already in progress, skipping...');
      return false;
    }

    // Check cooldown period
    const now = Date.now();
    if (now - lastSyncAttempt.current < syncCooldownMs) {
      console.log('⏸️ Wallet sync cooldown active, skipping...');
      return false;
    }

    // Check if user is authenticated
    if (!user?.id) {
      console.log('❌ Cannot sync wallet: User not authenticated');
      setLastError('User not authenticated');
      if (walletAddress) {
        toast.error('Please log in to sync your wallet address');
      }
      return false;
    }

    // Don't sync if it's the same wallet as last time
    if (lastSyncedWallet.current === walletAddress) {
      console.log('✅ Wallet address unchanged, skipping sync');
      return true;
    }

    syncInProgress.current = true;
    lastSyncAttempt.current = now;
    setSyncStatus('syncing');
    setLastError(null);

    try {
      console.log(`🔄 Attempting to sync wallet: ${walletAddress || 'null'} for user ${user.id}`);
      
      // Direct update attempt with detailed error logging
      const { data, error } = await supabase
        .from('users')
        .update({ wallet_address: walletAddress })
        .eq('id', user.id)
        .select('id, wallet_address');

      if (error) {
        console.error('❌ Database error syncing wallet:', error);
        console.error('🔍 Full error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        
        setLastError(error.message);
        setSyncStatus('error');
        toast.error(`Failed to sync wallet: ${error.message}`);
        return false;
      }

      // Verify update success
      if (!data || data.length === 0) {
        const errorMsg = 'No data returned from wallet update';
        console.error('❌ ' + errorMsg);
        setLastError(errorMsg);
        setSyncStatus('error');
        toast.error('Failed to sync wallet: No data returned');
        return false;
      }

      const updatedWallet = data[0]?.wallet_address;
      console.log('✅ Database update successful:', {
        expected: walletAddress,
        actual: updatedWallet,
        userId: user.id
      });

      // Update tracking
      lastSyncedWallet.current = walletAddress;
      setSyncStatus('success');

      // Force refresh user data
      console.log('🔄 Forcing user data refresh...');
      const refreshSuccess = await forceUserDataRefresh();
      if (!refreshSuccess) {
        console.warn('⚠️ User data refresh failed after wallet sync');
      }

      if (walletAddress) {
        toast.success('Wallet connected and synced successfully');
      } else {
        toast.success('Wallet disconnected successfully');
      }
      return true;

    } catch (error) {
      console.error('❌ Exception in wallet sync:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMessage);
      setSyncStatus('error');
      toast.error(`Failed to sync wallet: ${errorMessage}`);
      return false;
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, forceUserDataRefresh]);

  // Manual sync trigger for debugging and force sync
  const manualSyncTrigger = useCallback(async (): Promise<boolean> => {
    console.log('🔧 Manual sync trigger called');
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      console.log('🔧 Manual sync - wallet connected:', walletAddress);
      return await syncWalletToDatabase(walletAddress);
    } else {
      console.log('🔧 Manual sync - no wallet connected, clearing stored wallet');
      return await syncWalletToDatabase(null);
    }
  }, [connected, publicKey, syncWalletToDatabase]);

  // Enhanced useEffect with better dependency tracking
  useEffect(() => {
    console.log('🔄 useWalletSync useEffect triggered with:', {
      connected,
      publicKey: publicKey?.toString(),
      userId: user?.id,
      userWalletAddress: user?.wallet_address,
      syncInProgress: syncInProgress.current,
      lastSyncedWallet: lastSyncedWallet.current
    });

    // Wait for user data to be fully loaded
    if (!user) {
      console.log('⏸️ No user data loaded yet, waiting...');
      return;
    }

    // Skip if sync is in progress
    if (syncInProgress.current) {
      console.log('⏸️ Sync already in progress, skipping...');
      return;
    }

    const connectedWalletAddress = connected && publicKey ? publicKey.toString() : null;
    const storedWalletAddress = user.wallet_address;

    console.log('📊 Comparing wallet states:', {
      connectedWallet: connectedWalletAddress,
      storedWallet: storedWalletAddress,
      lastSynced: lastSyncedWallet.current
    });

    // Determine if sync is needed
    let shouldSync = false;
    let reason = '';

    if (connectedWalletAddress && connectedWalletAddress !== storedWalletAddress) {
      shouldSync = true;
      reason = 'Connected wallet differs from stored wallet';
    } else if (!connectedWalletAddress && storedWalletAddress && lastSyncedWallet.current) {
      shouldSync = true;
      reason = 'Wallet disconnected but stored wallet exists';
    }

    if (shouldSync) {
      console.log(`🔄 Sync needed: ${reason}`);
      setTimeout(() => {
        syncWalletToDatabase(connectedWalletAddress);
      }, 500);
    } else {
      console.log('✅ No sync needed - wallet states match');
      if (connectedWalletAddress) {
        lastSyncedWallet.current = connectedWalletAddress;
        setSyncStatus('success');
      }
    }
  }, [connected, publicKey?.toString(), user?.id, user?.wallet_address, syncWalletToDatabase]);

  const disconnectAndSync = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting and syncing wallet...');
      await disconnect();
      if (user?.id) {
        await syncWalletToDatabase(null);
      }
    } catch (error) {
      console.error('❌ Error disconnecting wallet:', error);
      toast.error('Failed to disconnect wallet');
    }
  }, [disconnect, syncWalletToDatabase, user?.id]);

  // Enhanced connection status
  const connectedWalletAddress = publicKey?.toString();
  const storedWalletAddress = user?.wallet_address;
  
  const isWalletSynced = connected && publicKey && user?.id && 
                        connectedWalletAddress === storedWalletAddress &&
                        syncStatus !== 'error';
  
  const needsAuth = connected && publicKey && !user?.id;
  
  const walletMismatch = connected && publicKey && user?.id && 
                        storedWalletAddress && 
                        connectedWalletAddress !== storedWalletAddress &&
                        syncStatus !== 'syncing';

  console.log('📊 Final wallet sync status:', {
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    syncStatus,
    lastError
  });

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    manualSyncTrigger,
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    walletAddress: connectedWalletAddress,
    storedWalletAddress,
    syncStatus,
    lastError
  };
};
