
import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser } from '@/lib/supabase';
import { toast } from 'sonner';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  currency: 'NGN' | 'USD';
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        if (event === 'SIGNED_IN' && session) {
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userData.user && !userError) {
              const mappedUser = mapSupabaseUser(userData.user);
              setUser(mappedUser);
              setCurrency(mappedUser.default_currency || 'NGN');
            }
          } catch (error) {
            console.error("Error processing sign in:", error);
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setCurrency('NGN');
          setIsLoading(false);
        } else if (event === 'USER_UPDATED') {
          try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            if (userData.user && !userError) {
              const mappedUser = mapSupabaseUser(userData.user);
              setUser(mappedUser);
              setCurrency(mappedUser.default_currency || 'NGN');
            }
          } catch (error) {
            console.error("Error processing user update:", error);
          } finally {
            setIsLoading(false);
          }
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (data?.session) {
          console.log("Found existing session:", data.session);
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            throw userError;
          }
          
          if (userData.user) {
            const mappedUser = mapSupabaseUser(userData.user);
            setUser(mappedUser);
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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    setUser,
    currency,
    setCurrency,
    isLoading,
    setIsLoading
  };
};
