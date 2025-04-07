
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

  // Helper function to get default currency based on location or saved preference
  const getDefaultCurrency = async (userCountry?: string) => {
    try {
      // First check if there's a saved preference in localStorage
      const savedPreference = localStorage.getItem('preferred_currency') as 'NGN' | 'USD' | null;
      if (savedPreference && (savedPreference === 'NGN' || savedPreference === 'USD')) {
        return savedPreference;
      }
      
      // If user has an explicit country preference, use that
      if (userCountry) {
        return userCountry.toLowerCase() === 'nigeria' ? 'NGN' : 'USD';
      }

      // Otherwise, try to detect location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      // Set NGN for Nigeria, USD for everyone else
      const detectedCurrency = data.country_code === 'NG' ? 'NGN' : 'USD';
      
      // Store the detected preference for future visits
      localStorage.setItem('preferred_currency', detectedCurrency);
      
      return detectedCurrency;
    } catch (error) {
      console.error('Error detecting location:', error);
      // Default to NGN if location detection fails
      return 'NGN';
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.id);
        
        if (session?.user) {
          try {
            const mappedUser = mapSupabaseUser(session.user);
            
            // Get additional user data from the users table, including status
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('role, status, full_name, country, default_currency, producer_name')
              .eq('id', session.user.id)
              .single();
            
            if (userError) {
              console.error("Error fetching user data:", userError);
            } else if (userData) {
              // Merge the user data with the auth data
              const enrichedUser: User = {
                ...mappedUser,
                role: userData.role || mappedUser.role,
                status: userData.status,
                full_name: userData.full_name,
                country: userData.country,
                producer_name: userData.producer_name,
              };
              
              setUser(enrichedUser);
              
              // Set currency based on user preference or location
              if (userData.default_currency) {
                setCurrency(userData.default_currency);
                // Also update localStorage to match user preference
                localStorage.setItem('preferred_currency', userData.default_currency);
              } else {
                const defaultCurrency = await getDefaultCurrency(enrichedUser.country);
                setCurrency(defaultCurrency);
              }
            } else {
              setUser(mappedUser);
              const defaultCurrency = await getDefaultCurrency();
              setCurrency(defaultCurrency);
            }
          } catch (error) {
            console.error("Error processing auth state change:", error);
          } finally {
            setIsLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          
          // Reset currency based on location for logged out users or saved preference
          const defaultCurrency = await getDefaultCurrency();
          setCurrency(defaultCurrency);
          
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
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
          
          // Get additional user data from the users table, including status
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('role, status, full_name, country, default_currency, producer_name')
            .eq('id', data.session.user.id)
            .single();
          
          if (userError) {
            console.error("Error fetching user data:", userError);
            setUser(mappedUser);
          } else if (userData) {
            // Merge the user data with the auth data
            const enrichedUser: User = {
              ...mappedUser,
              role: userData.role || mappedUser.role,
              status: userData.status,
              full_name: userData.full_name,
              country: userData.country,
              producer_name: userData.producer_name,
            };
            
            setUser(enrichedUser);
            
            // Set currency based on user preference or location
            if (userData.default_currency) {
              setCurrency(userData.default_currency);
              // Also update localStorage to match user preference
              localStorage.setItem('preferred_currency', userData.default_currency);
            } else {
              const defaultCurrency = await getDefaultCurrency(enrichedUser.country);
              setCurrency(defaultCurrency);
            }
          } else {
            setUser(mappedUser);
            const defaultCurrency = await getDefaultCurrency();
            setCurrency(defaultCurrency);
          }
        } else {
          // For logged out users, set currency based on location or saved preference
          const defaultCurrency = await getDefaultCurrency();
          setCurrency(defaultCurrency);
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
