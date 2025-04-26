
import { supabase } from '@/integrations/supabase/client';

// Connection monitor singleton
let isCheckingConnection = false;
let lastConnectionCheck = 0;
let isConnected = true;
let checkCount = 0;

// Connection test constants
const CHECK_INTERVAL = 30000; // Only check every 30 seconds
const MAX_CONSECUTIVE_FAILURES = 3;
let consecutiveFailures = 0;
let networkError = false;

/**
 * Check if Supabase connection is active
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  // Don't check too frequently
  const now = Date.now();
  if (now - lastConnectionCheck < CHECK_INTERVAL || isCheckingConnection) {
    return isConnected;
  }
  
  // Prevent concurrent checks
  isCheckingConnection = true;
  lastConnectionCheck = now;
  checkCount++;
  
  try {
    // Use a simple and fast query to test connection
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const { data, error } = await supabase
      .from('beats')
      .select('id')
      .limit(1);
    
    clearTimeout(timeoutId);
    
    // If we get a response at all, connection is working
    isConnected = !error;
    networkError = false;
    
    // Reset failure count on success
    if (isConnected) {
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      
      // Only log after multiple failures to avoid false alarms
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.log('Supabase connection error detected');
      }
    }
    
    return isConnected;
  } catch (e) {
    isConnected = false;
    networkError = true;
    consecutiveFailures++;
    
    // Only log after multiple failures to avoid false alarms
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('Network error detected when connecting to Supabase');
    }
    
    return false;
  } finally {
    isCheckingConnection = false;
  }
}

/**
 * Setup connection monitoring
 */
export async function setupHealthCheck(): Promise<void> {
  try {
    // Just check if we can connect to the database
    await checkSupabaseConnection();
    console.log('Supabase connection setup completed');
  } catch (e) {
    console.log('Error setting up connection monitoring');
  }
}

// Automatically run setup on module import
setupHealthCheck();

// Export a simple method to get current connection status
export function getConnectionStatus(): { isConnected: boolean; networkError: boolean } {
  return { isConnected, networkError };
}
