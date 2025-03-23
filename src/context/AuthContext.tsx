
import { createContext, useContext } from 'react';
import { User } from '@/types';
import { useAuthState } from '@/hooks/auth/useAuthState';
import { useAuthMethods } from '@/hooks/auth/useAuthMethods';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  currency: 'NGN' | 'USD';
  setCurrency: (currency: 'NGN' | 'USD') => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'producer') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    setUser, 
    currency, 
    setCurrency, 
    isLoading, 
    setIsLoading 
  } = useAuthState();
  
  const { 
    login, 
    signup, 
    logout, 
    updateProfile 
  } = useAuthMethods({ 
    setUser, 
    setCurrency, 
    setIsLoading 
  });

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
