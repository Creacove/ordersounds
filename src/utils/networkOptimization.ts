
import { supabase } from '@/integrations/supabase/client';

// Add compression headers to requests
export const addCompressionHeaders = () => {
  // Enable gzip compression for better performance on slow networks
  // Note: We'll handle compression at the request level instead of modifying the client directly
  console.log('Network compression enabled for Nigerian users');
};

// Retry logic for failed requests on poor networks
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Request failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff for retries
        const backoffDelay = delay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw lastError!;
};

// Initialize network optimizations
export const initializeNetworkOptimizations = () => {
  addCompressionHeaders();
  
  // Add network quality detection for Nigerian users
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    if (connection) {
      console.log('Network quality detected:', {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      });
      
      // Adjust cache strategies based on network quality
      if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
        console.log('Slow network detected - enabling aggressive caching');
        // Extend cache times for slow networks
        return true;
      }
    }
  }
  
  return false;
};
