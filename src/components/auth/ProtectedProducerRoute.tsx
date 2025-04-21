
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ProtectedProducerRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading, isProducerInactive } = useAuth();

  // Show loading state if auth is still being checked
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to activation page if producer is inactive
  if (isProducerInactive) {
    return <Navigate to="/producer-activation" replace />;
  }

  // Redirect to home if not a producer
  if (user.role !== 'producer') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Add default export to fix TypeScript error
export default ProtectedProducerRoute;
