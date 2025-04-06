
import { useState, useEffect } from 'react';

interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: number;
}

export function useUniqueNotifications(dedupeTimeMs: number = 5000) {
  const [notificationHistory, setNotificationHistory] = useState<NotificationMessage[]>([]);
  
  // Clean up old notifications periodically
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setNotificationHistory(prev => 
        prev.filter(notification => now - notification.timestamp < dedupeTimeMs)
      );
    }, dedupeTimeMs);
    
    return () => clearInterval(cleanupInterval);
  }, [dedupeTimeMs]);
  
  // Check if a notification is a duplicate
  const isDuplicate = (message: string): boolean => {
    return notificationHistory.some(n => n.message === message);
  };
  
  // Add a notification to history
  const addNotification = (id: string, message: string, type: 'success' | 'error' | 'info' | 'warning'): void => {
    setNotificationHistory(prev => [
      ...prev,
      { 
        id, 
        message, 
        type, 
        timestamp: Date.now() 
      }
    ]);
  };
  
  return {
    isDuplicate,
    addNotification
  };
}
