
import { useState } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastRecord {
  message: string;
  timestamp: number;
  type: ToastType;
}

/**
 * Hook to prevent duplicate toast notifications
 * @param dedupeTimeMs Time window in milliseconds to prevent duplicate toasts
 */
export function useToastDeduplication(dedupeTimeMs: number = 5000) {
  const [recentToasts, setRecentToasts] = useState<ToastRecord[]>([]);
  
  /**
   * Check if a toast with the same message and type was shown recently
   */
  const isDuplicateToast = (message: string, type: ToastType): boolean => {
    const now = Date.now();
    const isDuplicate = recentToasts.some(
      toast => 
        toast.message === message && 
        toast.type === type && 
        now - toast.timestamp < dedupeTimeMs
    );
    
    return isDuplicate;
  };
  
  /**
   * Record a toast being shown to prevent duplicates
   */
  const recordToast = (message: string, type: ToastType): void => {
    const now = Date.now();
    
    // Add new toast to history
    setRecentToasts(prev => [
      ...prev.filter(toast => now - toast.timestamp < dedupeTimeMs), // Keep only recent ones
      { message, type, timestamp: now }
    ]);
  };
  
  return {
    isDuplicateToast,
    recordToast
  };
}
