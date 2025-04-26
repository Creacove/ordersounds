
import { useState, useEffect, useCallback } from 'react';
import { checkSupabaseConnection, getConnectionStatus } from '@/lib/supabaseConnectionMonitor';

/**
 * Hook to monitor Supabase connection status
 */
export function useSupabaseConnection() {
  const [isConnected, setIsConnected] = useState(getConnectionStatus());
  const [isChecking, setIsChecking] = useState(false);
  
  // Check connection status
  const checkConnection = useCallback(async (force = false) => {
    if (isChecking && !force) return isConnected;
    
    setIsChecking(true);
    try {
      const status = await checkSupabaseConnection();
      setIsConnected(status);
      return status;
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, isConnected]);
  
  // Set up periodic checks
  useEffect(() => {
    // Check once on mount
    checkConnection();
    
    // Check connection every minute
    const interval = setInterval(() => {
      checkConnection();
    }, 60000);
    
    // On network status change, check connection
    const handleOnline = () => {
      checkConnection(true);
    };
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [checkConnection]);
  
  return {
    isConnected,
    isChecking,
    checkConnection
  };
}
