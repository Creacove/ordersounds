
import { toast as sonnerToast } from 'sonner';

// Create a uniqueness cache with expiry to prevent duplicate toasts
// This is a module-level cache to work across components
const toastCache = new Map<string, number>();
const TOAST_DEDUPE_WINDOW = 5000; // 5 seconds

/**
 * Enhanced toast function that prevents duplicates within a time window
 */
export const uniqueToast = {
  success: (message: string, options?: any) => {
    if (shouldShowToast(message, 'success')) {
      return sonnerToast.success(message, options);
    }
  },
  
  error: (message: string, options?: any) => {
    if (shouldShowToast(message, 'error')) {
      return sonnerToast.error(message, options);
    }
  },
  
  info: (message: string, options?: any) => {
    if (shouldShowToast(message, 'info')) {
      return sonnerToast.info(message, options);
    }
  },
  
  warning: (message: string, options?: any) => {
    if (shouldShowToast(message, 'warning')) {
      return sonnerToast.warning(message, options);
    }
  }
};

function shouldShowToast(message: string, type: string): boolean {
  const now = Date.now();
  const key = `${type}:${message}`;
  
  // Clean expired entries
  for (const [existingKey, timestamp] of toastCache.entries()) {
    if (now - timestamp > TOAST_DEDUPE_WINDOW) {
      toastCache.delete(existingKey);
    }
  }
  
  // Check if this is a duplicate
  if (toastCache.has(key)) {
    return false;
  }
  
  // Record this toast
  toastCache.set(key, now);
  return true;
}
