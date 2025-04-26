
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
    // Use a simple and fast query to test connection
    const { data, error } = await supabase
      .from('health_check')
      .select('status')
      .maybeSingle()
      .timeout(5000);
    
    // If we get a response at all, connection is working
    isConnected = !error;
    
    // Reset failure count on success
    if (isConnected) {
      if (consecutiveFailures > 0) {
        toast.success("Connection to server restored");
      }
      consecutiveFailures = 0;
    } else {
      consecutiveFailures++;
      
      // Only notify after multiple failures to avoid false alarms
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        console.error('Supabase connection error:', error);
        toast.error("Server connection issues detected");
      }
    }
    
    return isConnected;
  } catch (e) {
    isConnected = false;
    consecutiveFailures++;
    
    // Only notify after multiple failures to avoid false alarms
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.error('Error checking Supabase connection:', e);
      toast.error("Server connection issues detected");
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
    if (error && !data) {
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
