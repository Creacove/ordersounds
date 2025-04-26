
import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, WifiOff } from 'lucide-react';
import { useSupabaseConnection } from '@/hooks/useSupabaseConnection';

interface ConnectionErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onRetry?: () => void;
  showAlert?: boolean;
}

export function ConnectionErrorBoundary({
  children,
  fallback,
  onRetry,
  showAlert = false // Changed default to false to avoid showing unnecessary alerts
}: ConnectionErrorBoundaryProps) {
  const { isConnected, checkConnection } = useSupabaseConnection();
  const [isRetrying, setIsRetrying] = useState(false);
  const [showError, setShowError] = useState(false);
  
  const handleRetry = async () => {
    if (isRetrying) return;
    
    setIsRetrying(true);
    try {
      await checkConnection(true);
      if (onRetry) {
        onRetry();
      }
      // Only show error if manually retrying and still not connected
      setShowError(!isConnected);
    } finally {
      setIsRetrying(false);
    }
  };
  
  // Only show alert if explicitly enabled AND connection is lost AND user has manually requested to show it
  if (!isConnected && showAlert && showError) {
    return (
      <div className="space-y-4">
        {fallback || (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Unable to connect to the server. Please check your network connection.</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto" 
                onClick={handleRetry}
                disabled={isRetrying}
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying ? "animate-spin" : "")} />
                {isRetrying ? "Checking connection..." : "Retry Connection"}
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {children}
      </div>
    );
  }
  
  return <>{children}</>;
}

// Helper function for conditional class names
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
