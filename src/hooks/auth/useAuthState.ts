
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
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (session?.user) {
          try {
            const mappedUser = mapSupabaseUser(session.user);
            setUser(mappedUser);
            setCurrency(mappedUser.default_currency || 'NGN');
          } catch (error) {
            console.error("Error processing auth state change:", error);
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          // Removed the invalid "USER_DELETED" event type
          setUser(null);
          setCurrency('NGN');
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          setIsLoading(false);
          return;
        }
        
        if (data?.session?.user) {
          console.log("Found existing session:", data.session.user.id);
          const mappedUser = mapSupabaseUser(data.session.user);
          setUser(mappedUser);
          setCurrency(mappedUser.default_currency || 'NGN');
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Check session immediately
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
