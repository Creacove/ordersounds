
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
  const lastSyncAttempt = useRef<number>(0);
  const syncCooldownMs = 2000; // 2 second cooldown between sync attempts

  const syncWalletToDatabase = useCallback(async (walletAddress: string | null) => {
    console.log('🔄 syncWalletToDatabase called with:', { walletAddress, userId: user?.id });
    
    // Prevent concurrent syncs
    if (syncInProgress.current) {
      console.log('⏸️ Wallet sync already in progress, skipping...');
      return false;
    }

    // Check cooldown period to prevent rapid fire syncs
    const now = Date.now();
    if (now - lastSyncAttempt.current < syncCooldownMs) {
      console.log('⏸️ Wallet sync cooldown active, skipping...');
      return false;
    }

    // Check if user is authenticated first
    if (!user?.id) {
      console.log('❌ Cannot sync wallet: User not authenticated');
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

    try {
      console.log(`🔄 Syncing wallet address to database: ${walletAddress || 'null'}`);
      console.log('📊 User ID:', user.id);
      console.log('💾 Current stored wallet:', user.wallet_address);
      
      // First, let's verify we can read from the users table
      const { data: currentUser, error: readError } = await supabase
        .from('users')
        .select('id, wallet_address')
        .eq('id', user.id)
        .single();

      if (readError) {
        console.error('❌ Error reading current user data:', readError);
        toast.error('Failed to verify user data');
        return false;
      }

      console.log('📖 Current user data from DB:', currentUser);

      // Now attempt the update
      const { data, error } = await supabase
        .from('users')
        .update({ 
          wallet_address: walletAddress 
        })
        .eq('id', user.id)
        .select('wallet_address');

      if (error) {
        console.error('❌ Database error syncing wallet:', error);
        console.error('🔍 Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast.error(`Failed to sync wallet: ${error.message}`);
        return false;
      }

      // Verify the update actually worked
      if (!data || data.length === 0) {
        console.error('❌ No data returned from wallet update - possible RLS policy issue');
        toast.error('Failed to sync wallet: Permission denied');
        return false;
      }

      const updatedWallet = data[0]?.wallet_address;
      if (updatedWallet !== walletAddress) {
        console.error('❌ Wallet update verification failed:', {
          expected: walletAddress,
          actual: updatedWallet
        });
        toast.error('Wallet sync verification failed');
        return false;
      }

      console.log('✅ Wallet sync successful, verified in database');
      
      // Update last synced wallet
      lastSyncedWallet.current = walletAddress;

      // Force refresh user data to get the updated wallet address
      console.log('🔄 Forcing user data refresh...');
      const refreshSuccess = await forceUserDataRefresh();
      if (!refreshSuccess) {
        console.warn('⚠️ User data refresh failed after wallet sync');
      } else {
        console.log('✅ User data refreshed successfully');
      }

      if (walletAddress) {
        toast.success('Wallet connected and synced');
      } else {
        toast.success('Wallet disconnected');
      }
      return true;
    } catch (error) {
      console.error('❌ Exception in wallet sync:', error);
      toast.error(`Failed to sync wallet: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      syncInProgress.current = false;
    }
  }, [user?.id, user?.wallet_address, forceUserDataRefresh]);

  // Manual trigger function for debugging
  const manualSyncTrigger = useCallback(async () => {
    console.log('🔧 Manual sync trigger called');
    if (connected && publicKey) {
      const walletAddress = publicKey.toString();
      console.log('🔧 Manual sync - wallet connected:', walletAddress);
      return await syncWalletToDatabase(walletAddress);
    } else {
      console.log('🔧 Manual sync - no wallet connected');
      return await syncWalletToDatabase(null);
    }
  }, [connected, publicKey, syncWalletToDatabase]);

  // Enhanced sync logic with better state management
  useEffect(() => {
    console.log('🔄 useWalletSync useEffect triggered with:', {
      connected,
      publicKey: publicKey?.toString(),
      userId: user?.id,
      userWalletAddress: user?.wallet_address,
      syncInProgress: syncInProgress.current
    });

    // Don't sync if sync is already in progress
    if (syncInProgress.current) {
      console.log('⏸️ Sync in progress, skipping useEffect');
      return;
    }

    // Wait for user authentication to be fully loaded
    if (!user) {
      console.log('⏸️ No user loaded yet, skipping sync');
      return;
    }

    if (connected && publicKey) {
      const connectedWalletAddress = publicKey.toString();
      console.log('🔗 Wallet connected:', connectedWalletAddress);
      console.log('💾 User stored wallet:', user.wallet_address);
      
      // Only sync if the connected wallet is different from stored wallet
      if (user.wallet_address !== connectedWalletAddress) {
        console.log('🔄 Wallet addresses differ, syncing...');
        console.log('📊 Current stored wallet:', user.wallet_address);
        console.log('📊 Connected wallet:', connectedWalletAddress);
        
        // Add a small delay to ensure wallet is fully connected
        setTimeout(() => {
          syncWalletToDatabase(connectedWalletAddress);
        }, 500);
      } else {
        console.log('✅ Wallet already synced, no action needed');
        lastSyncedWallet.current = connectedWalletAddress;
      }
    } else if (!connected && user.wallet_address && lastSyncedWallet.current) {
      // Only sync disconnection if user is authenticated and has a stored wallet
      console.log('🔌 Wallet disconnected, syncing to database...');
      setTimeout(() => {
        syncWalletToDatabase(null);
      }, 500);
    } else {
      console.log('⏸️ No sync needed - wallet states match');
    }
  }, [connected, publicKey, user?.id, user?.wallet_address, syncWalletToDatabase]);

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

  // Enhanced connection status with proper database comparison
  const connectedWalletAddress = publicKey?.toString();
  const storedWalletAddress = user?.wallet_address;
  
  console.log('📊 Connection status check:', {
    connected,
    connectedWalletAddress,
    storedWalletAddress,
    userId: user?.id
  });
  
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

  console.log('📊 Final status:', {
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected
  });

  return {
    syncWalletToDatabase,
    disconnectAndSync,
    manualSyncTrigger, // Added for debugging
    isWalletSynced,
    needsAuth,
    walletMismatch,
    isConnected: connected,
    walletAddress: connectedWalletAddress,
    storedWalletAddress
  };
};
