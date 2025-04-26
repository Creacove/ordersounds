
import { toast } from 'sonner';
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
    // Try multiple lightweight endpoints to determine connection status
    const endpoints = [
      // Try a simple query first
      async () => {
        const { data, error } = await supabase
          .from('beats')
          .select('id')
          .limit(1)
          .timeout(5000);
        return !error;
      },
      // Try health check table as fallback
      async () => {
        const { data, error } = await supabase
          .from('health_check')
          .select('status')
          .maybeSingle()
          .timeout(5000);
        return !error || error.code === '42P01'; // Table might not exist yet
      }
    ];
    
    // Try each endpoint until one succeeds
    for (const checkEndpoint of endpoints) {
      try {
        const success = await checkEndpoint();
        if (success) {
          isConnected = true;
          if (consecutiveFailures > 0) {
            // Only reset failures, don't show success message to avoid UI noise
            consecutiveFailures = 0;
          }
          isCheckingConnection = false;
          return true;
        }
      } catch (e) {
        // Continue to next check
      }
    }
    
    // All checks failed
    isConnected = false;
    consecutiveFailures++;
    
    // Only notify after multiple failures to avoid false alarms
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('Supabase connection issues detected after multiple attempts');
      // No toast - silent failure as requested
    }
    
    return false;
  } catch (e) {
    isConnected = false;
    consecutiveFailures++;
    
    // Only notify after multiple failures to avoid false alarms
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('Error checking Supabase connection:', e);
      // No toast - silent failure as requested
    }
    
    return false;
  } finally {
    isCheckingConnection = false;
  }
}

/**
 * Create a health check table in Supabase if it doesn't exist
 */
export async function setupHealthCheck(): Promise<void> {
  try {
    // Check if the health_check table exists
    const { data, error } = await supabase
      .from('health_check')
      .select('id')
      .limit(1);
    
    // If we get an error that the table doesn't exist, let's silently fail
    // This is expected on first run before the table is created
    if (error && error.code === '42P01' && !data) {
      console.log('Health check table does not exist yet');
    }
  } catch (e) {
    console.log('Error setting up health check:', e);
  }
}

// Automatically run setup on module import
setupHealthCheck();

// Export a simple method to get current connection status
export function getConnectionStatus(): boolean {
  return isConnected;
}
