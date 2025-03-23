
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';

// Mock supabase client
// In a real implementation, this would be replaced with actual Supabase integration
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  role: 'buyer',
  name: 'John Doe',
  created_at: new Date().toISOString(),
  avatar_url: 'https://i.pravatar.cc/150?img=1',
  country: 'Nigeria',
  default_currency: 'NGN'
};

const mockProducer: User = {
  id: '2',
  email: 'producer@example.com',
  role: 'producer',
  name: 'Jane Smith',
  producer_name: 'Heritage beatz',
  created_at: new Date().toISOString(),
  avatar_url: 'https://i.pravatar.cc/150?img=2',
  country: 'United States',
  default_currency: 'USD'
};

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  currency: 'NGN' | 'USD';
  setCurrency: (currency: 'NGN' | 'USD') => void;
  login: (email: string, password: string, role?: 'buyer' | 'producer') => Promise<void>;
  signup: (email: string, password: string, name: string, role: 'buyer' | 'producer') => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // Mock session check
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  useEffect(() => {
    // Set default currency based on user country if available
    if (user && user.default_currency) {
      setCurrency(user.default_currency);
    }
  }, [user]);

  // Mock authentication methods
  const login = async (email: string, password: string, role?: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real implementation, this would validate against Supabase
      if (email === 'user@example.com' && password === 'password') {
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        toast.success('Login successful');
        navigate('/');
      } else if (email === 'producer@example.com' && password === 'password') {
        setUser(mockProducer);
        localStorage.setItem('user', JSON.stringify(mockProducer));
        toast.success('Login successful');
        navigate('/producer/dashboard');
      } else {
        toast.error('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      // Simulate signup delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock signup (in a real app, this would create a user in Supabase)
      const newUser: User = {
        id: '3',
        email,
        name,
        role,
        created_at: new Date().toISOString(),
        country: 'Nigeria',
        default_currency: 'NGN'
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
      toast.success('Account created successfully');
      navigate(role === 'buyer' ? '/' : '/producer/dashboard');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // In a real app, this would call supabase.auth.signOut()
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Mock profile update
      const updatedUser = { ...user, ...data };
      setUser(updatedUser as User);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

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
