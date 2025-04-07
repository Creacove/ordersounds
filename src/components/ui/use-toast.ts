
import { toast as sonnerToast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

type ToastOptions = {
  id?: string;
  description?: string; 
  action?: React.ReactNode;
  cancel?: React.ReactNode;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  important?: boolean;
};

// Enhanced toast with deduplication
const enhancedToast = {
  // Keep track of recent notifications to prevent duplicates
  _notificationHistory: new Map<string, number>(),
  _dedupeTimeMs: 5000, // 5 seconds de-duplication window
  
  _isDuplicate(message: string): boolean {
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, timestamp] of this._notificationHistory.entries()) {
      if (now - timestamp > this._dedupeTimeMs) {
        this._notificationHistory.delete(key);
      }
    }
    
    return this._notificationHistory.has(message);
  },
  
  success(message: string, options?: ToastOptions) {
    if (this._isDuplicate(message)) return null;
    
    this._notificationHistory.set(message, Date.now());
    return sonnerToast.success(message, {
      id: `${message}-${Date.now()}`, // Add unique ID to prevent duplicates
      ...options
    });
  },
  
  error(message: string, options?: ToastOptions) {
    if (this._isDuplicate(message)) return null;
    
    this._notificationHistory.set(message, Date.now());
    return sonnerToast.error(message, {
      id: `${message}-${Date.now()}`,
      ...options
    });
  },
  
  info(message: string, options?: ToastOptions) {
    if (this._isDuplicate(message)) return null;
    
    this._notificationHistory.set(message, Date.now());
    return sonnerToast.info(message, {
      id: `${message}-${Date.now()}`,
      ...options
    });
  },
  
  warning(message: string, options?: ToastOptions) {
    if (this._isDuplicate(message)) return null;
    
    this._notificationHistory.set(message, Date.now());
    return sonnerToast.warning(message, {
      id: `${message}-${Date.now()}`,
      ...options
    });
  },
  
  // Pass through other methods
  dismiss: sonnerToast.dismiss,
  promise: sonnerToast.promise,
  custom: sonnerToast.custom,
  loading: sonnerToast.loading
};

export const toast = enhancedToast;
