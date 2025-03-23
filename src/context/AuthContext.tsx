
import { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { User } from '@/types';
import { supabase, mapSupabaseUser } from '@/lib/supabase';

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
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          if (userData.user) {
            const mappedUser = mapSupabaseUser(userData.user);
            setUser(mappedUser);
            
            // Set currency based on user's country
            setCurrency(mappedUser.default_currency || 'NGN');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data, error } = await supabase.auth.getUser();
        if (data.user && !error) {
          const mappedUser = mapSupabaseUser(data.user);
          setUser(mappedUser);
          setCurrency(mappedUser.default_currency || 'NGN');
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrency('NGN');
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      if (data?.user) {
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        setCurrency(mappedUser.default_currency || 'NGN');
        toast.success('Login successful');
        
        // Redirect based on role
        if (mappedUser.role === 'producer') {
          navigate('/producer/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            country: 'Nigeria', // Default, can be updated in profile settings
          }
        }
      });

      if (error) {
        toast.error(error.message);
        throw error;
      }

      if (data?.user) {
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        setCurrency(mappedUser.default_currency || 'NGN');
        toast.success('Account created successfully');
        
        // Create user record in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            full_name: name,
            email: email,
            role: role,
            password_hash: 'managed-by-supabase', // Supabase handles the actual hashing
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          toast.error('Could not complete profile setup');
        }

        // Redirect based on role
        if (role === 'producer') {
          navigate('/producer/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.name,
          stage_name: data.producer_name,
          bio: data.bio,
          country: data.country,
          profile_picture: data.avatar_url,
        }
      });

      if (authError) {
        throw authError;
      }

      // Update users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: data.name,
          stage_name: data.producer_name,
          bio: data.bio,
          country: data.country,
          profile_picture: data.avatar_url,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      // Update local state
      setUser({ ...user, ...data });
      
      // Update currency if country changed
      if (data.default_currency) {
        setCurrency(data.default_currency);
      }
      
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
