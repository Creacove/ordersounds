
import React, { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { getConnectionStatus } from "@/lib/supabaseConnectionMonitor";

// This component provides a silent error boundary that handles connection issues
// without displaying alerts to users, but gracefully falls back to cached content
export const ConnectionErrorBoundary: React.FC<{
  children: ReactNode;
  onRetry?: () => Promise<void> | void; 
  showAlert?: boolean; // Set to false to be completely silent
}> = ({ children, onRetry, showAlert = false }) => {
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [retrying, setRetrying] = useState(false);
  
  // Check connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      const { isConnected, networkError } = getConnectionStatus();
      // Only show error if explicitly enabled and there's a network error
      setIsErrorVisible(showAlert && networkError);
    };
    
    // Check immediately 
    checkConnection();
    
    // Then check periodically
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [showAlert]);
  
  const handleRetry = async () => {
    setRetrying(true);
    try {
      if (onRetry) {
        await onRetry();
      }
      setIsErrorVisible(false);
    } catch (error) {
      console.error("Error during retry:", error);
    } finally {
      setRetrying(false);
    }
  };
  
  // Show error bar only if we're supposed to show alerts and there's an error
  return (
    <>
      {isErrorVisible && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 shadow-md">
          <div className="flex">
            <div className="flex-grow">
              <p className="text-sm text-yellow-700">
                We're having trouble connecting to our servers. You're viewing cached content.
              </p>
            </div>
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetry}
                disabled={retrying}
                className="text-yellow-700 border-yellow-600 hover:bg-yellow-100"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Retry'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {children}
    </>
  );
};
