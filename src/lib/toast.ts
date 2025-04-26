
import { toast as sonnerToast, type ToastT as SonnerToast } from 'sonner';

// Set of recent toast IDs to prevent duplicates
const recentToasts = new Set<string>();
const TOAST_DEDUPE_TIMEOUT = 5000; // 5 seconds

// Generate a unique ID for a toast
function generateToastId(type: string, message: string): string {
  return `${type}:${message}`;
}

// Add a toast ID to the recent set and remove it after timeout
function trackToast(id: string): void {
  recentToasts.add(id);
  setTimeout(() => {
    recentToasts.delete(id);
  }, TOAST_DEDUPE_TIMEOUT);
}

// Check if a toast was recently shown
function wasRecentlyShown(id: string): boolean {
  return recentToasts.has(id);
}

// Base toast function with deduplication
function baseToast(
  type: 'success' | 'error' | 'info' | 'warning' | 'loading',
  message: string,
  options?: any
) {
  const id = options?.id || generateToastId(type, message);
  
  if (wasRecentlyShown(id)) {
    return null; // Skip duplicate toast
  }
  
  trackToast(id);
  
  switch (type) {
    case 'success':
      return sonnerToast.success(message, options);
    case 'error':
      console.error("Toast error:", message);
      return sonnerToast.error(message, options);
    case 'info':
      return sonnerToast.info(message, options);
    case 'warning':
      return sonnerToast.warning(message, options);
    case 'loading':
      return sonnerToast.loading(message, options);
    default:
      return sonnerToast(message, options);
  }
}

// Export uniqueToast with deduplication built in
export const uniqueToast = {
  success: (message: string, options?: any) => baseToast('success', message, {
    duration: 3000,
    ...options
  }),
  
  error: (message: string, options?: any) => baseToast('error', message, {
    duration: 5000,
    ...options
  }),
  
  info: (message: string, options?: any) => baseToast('info', message, {
    duration: 3000,
    ...options
  }),
  
  warning: (message: string, options?: any) => baseToast('warning', message, {
    duration: 4000,
    ...options
  }),
  
  loading: (message: string, options?: any) => baseToast('loading', message, options),
  
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom
};
