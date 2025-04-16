
import { createContext, useContext, useEffect } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';
import { toast } from 'sonner';
import { logSessionEvent } from '@/lib/authLogger';
import { initiateRecoveryFlow } from '@/lib/authLogger';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  currency: 'NGN' | 'USD';
  setCurrency: (currency: 'NGN' | 'USD') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'producer') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserInfo: (user: User) => void;
  isProducerInactive: boolean;
  authError: string | null;
  refreshSession: () => Promise<boolean>;
  recoverSession: (email?: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    setUser, 
    currency, 
    setCurrency, 
    isLoading, 
    setIsLoading,
    authError,
    setAuthError,
    appVersion,
    consecutiveErrors,
    setConsecutiveErrors
  } = useAuthState();
  
  const { 
    login, 
    signup, 
    logout, 
    updateProfile,
    refreshSession
  } = useAuthMethods({ 
    setUser, 
    setCurrency, 
    setIsLoading,
    setAuthError,
    setConsecutiveErrors,
    appVersion
  });

  // Function to directly update user info in context
  const updateUserInfo = (updatedUser: User) => {
    setUser(updatedUser);
    setConsecutiveErrors(0); // Reset error counter on successful user update
  };
  
  // Check if producer is inactive
  const isProducerInactive = 
    user?.role === 'producer' && 
    user?.status === 'inactive';
    
  // Recovery function exposed to components
  const recoverSession = (email?: string) => {
    initiateRecoveryFlow(email);
  };
  
  // Log auth errors for monitoring
  useEffect(() => {
    if (authError) {
      console.error('Authentication error:', authError);
      // Only show toast for non-silent errors (silent errors are handled internally)
      if (!authError.includes('[silent]')) {
        toast.error(`Authentication error: ${authError}`);
      }
      
      // Log auth errors to our new system
      if (user) {
        logSessionEvent('auth_error', { 
          error: authError,
          user_id: user.id
        });
      } else {
        logSessionEvent('auth_error', { error: authError });
      }
      
      // Track consecutive errors - if we get too many, suggest recovery
      if (consecutiveErrors >= 3 && !authError.includes('[silent]')) {
        toast.error(
          "We're having trouble with your session. Please try logging in again.", 
          { 
            action: {
              label: "Fix Now",
              onClick: () => initiateRecoveryFlow(user?.email)
            }
          }
        );
      }
    }
  }, [authError, user, consecutiveErrors]);

  // Version-aware token migration on app startup
  useEffect(() => {
    // Try to refresh the session on app load
    const initAuth = async () => {
      if (!isLoading && !user) {
        try {
          await refreshSession();
        } catch (error) {
          // Silent error, handled by refreshSession
          console.log('Silent session refresh attempt failed');
        }
      }
    };
    
    initAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        currency,
        setCurrency,
        login,
        signup,
        logout,
        updateProfile,
        updateUserInfo,
        isProducerInactive,
        authError,
        refreshSession,
        recoverSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
