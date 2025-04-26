
import { supabase } from '@/integrations/supabase/client';

// Connection monitor singleton
let isCheckingConnection = false;
let lastConnectionCheck = 0;
let isConnected = true;

// Connection test constants
const CHECK_INTERVAL = 30000; // Only check every 30 seconds

/**
 * Check if Supabase connection is active by querying the beats table
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  // Don't check too frequently
  const now = Date.now();
  if (now - lastConnectionCheck < CHECK_INTERVAL || isCheckingConnection) {
    return isConnected;
  }
  
  isCheckingConnection = true;
  lastConnectionCheck = now;
  
  try {
    // Simple query to check if we can reach the database
    const { error } = await supabase
      .from('beats')
      .select('id')
      .limit(1)
      .single();
    
    // If we get an auth error, the service is up but auth is working
    // which is good enough for most purposes
    if (error?.code === 'PGRST301') {
      isConnected = true;
      return true;
    }
    
    isConnected = !error;
    return !error;
  } catch (error) {
    console.error('Supabase connectivity error:', error);
    isConnected = false;
    return false;
  } finally {
    isCheckingConnection = false;
  }
}

// Export a simple method to get current connection status
export function getConnectionStatus(): boolean {
  return isConnected;
}
