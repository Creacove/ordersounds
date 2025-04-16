
import { useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase";
import { uniqueToast } from "@/lib/toast";

// Current app version - used for version-aware migrations
const CURRENT_APP_VERSION = '1.0.1'; // Increment this when making auth-related changes

// Get the previously stored app version
const getPreviousAppVersion = (): string | null => {
  try {
    return localStorage.getItem('app_version');
  } catch (error) {
    console.error('Error getting app version from localStorage:', error);
    return null;
  }
};

// Store the current app version
const storeCurrentAppVersion = (): void => {
  try {
    localStorage.setItem('app_version', CURRENT_APP_VERSION);
  } catch (error) {
    console.error('Error storing app version in localStorage:', error);
  }
};

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  currency: "NGN" | "USD";
  authError: string | null;
  appVersion: {
    current: string;
    previous: string | null;
    hasChanged: boolean;
  };
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [hasShownError, setHasShownError] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const maxRetries = 3;

  // Track app version for migration purposes
  const previousVersion = getPreviousAppVersion();
  const [appVersion] = useState({
    current: CURRENT_APP_VERSION,
    previous: previousVersion,
    hasChanged: previousVersion !== null && previousVersion !== CURRENT_APP_VERSION
  });

  // Store the current app version after initialization
  useEffect(() => {
    storeCurrentAppVersion();
  }, []);

  const getCurrencyFromLocalStorage = () => {
    try {
      const savedPreference = localStorage.getItem("preferred_currency") as
        | "NGN"
        | "USD"
        | null;
      return savedPreference &&
        (savedPreference === "NGN" || savedPreference === "USD")
        ? savedPreference
        : "NGN";
    } catch (error) {
      console.error("Error getting currency from localStorage:", error);
      return "NGN";
    }
  };

  // Function to fetch user data with retry logic
  const fetchUserData = async (userId: string, onSuccess: (userData: any) => void) => {
    try {
      // Get additional user data from the users table, including status
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("role, status, full_name, country")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        console.error("Error fetching user data:", userError);
        
        // Implement retry logic for temporary network issues
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          console.log(`Retrying user data fetch (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => fetchUserData(userId, onSuccess), 2000 * (retryCount + 1)); // Increasing backoff
          return;
        }
        
        // Only show the error toast once per session
        if (!hasShownError) {
          uniqueToast.error("Unable to load user data. Please refresh the page.");
          setHasShownError(true);
        }
        
        setAuthError(`Error fetching user data: ${userError.message}`);
        throw userError;
      }
      
      // Reset retry count and error flag on success
      setRetryCount(0);
      setHasShownError(false);
      setAuthError(null);
      
      // Call success handler if data was retrieved
      if (userData) {
        onSuccess(userData);
      }
    } catch (error: any) {
      console.error("Error in fetchUserData:", error);
      
      // Only show the error toast once per session
      if (retryCount >= maxRetries && !hasShownError) {
        uniqueToast.error("Unable to load user data. Please refresh the page.");
        setHasShownError(true);
      }
      
      setAuthError(`[silent] Error fetching user data: ${error.message}`);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // IMPORTANT: First check for existing session to avoid flicker
    const checkSession = async () => {
      try {
        console.log("Checking for existing session");
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session check error:", error);
          if (mounted) {
            setIsLoading(false);
            setAuthError(`[silent] Session check failed: ${error.message}`);
          }
          return;
        }

        if (data?.session?.user) {
          console.log("Found existing session:", data.session.user.id);
          if (!mounted) return;
          
          const mappedUser = mapSupabaseUser(data.session.user);

          // Set the basic user immediately to avoid UI flicker
          setUser(mappedUser);
          
          // Get user data in a setTimeout to avoid deadlocks with auth state changes
          setTimeout(async () => {
            if (!mounted) return;
            
            fetchUserData(data.session.user.id, (userData) => {
              if (!mounted) return;
              
              // Ensure role is a valid type
              const validRole: 'buyer' | 'producer' | 'admin' = 
                (userData?.role === 'buyer' || userData?.role === 'producer' || userData?.role === 'admin') 
                  ? userData.role 
                  : 'buyer';
              
              // Ensure status is a valid type
              const validStatus: 'active' | 'inactive' =
                userData?.status === 'active' || userData?.status === 'inactive'
                  ? userData.status
                  : 'inactive';

              // Merge the user data with the auth data
              const enrichedUser: User = {
                ...mappedUser,
                role: validRole,
                status: validStatus,
                full_name: userData?.full_name || '',
                country: userData?.country || '',
              };

              setUser(enrichedUser);

              const currency = getCurrencyFromLocalStorage();
              setCurrency(currency);
              
              // Finally set loading to false
              setIsLoading(false);
            });
          }, 100); // Slightly reduced delay as we're using setTimeout for safer auth operations
        } else {
          if (mounted) {
            setIsLoading(false);
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
          }
        }
      } catch (error: any) {
        console.error("Session check error:", error);
        if (mounted) {
          setIsLoading(false);
          setAuthError(`[silent] Session check error: ${error.message}`);
        }
      }
    };

    // IMPORTANT: Set up auth state listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      if (session?.user && event !== 'SIGNED_OUT') {
        const mappedUser = mapSupabaseUser(session.user);
        
        // Set the basic user immediately to avoid UI flicker
        setUser(mappedUser);
        setHasShownError(false); // Reset error flag on new auth state
        
        // Then fetch additional data after a slight delay to avoid race conditions
        setTimeout(async () => {
          if (!mounted) return;
          
          fetchUserData(session.user.id, (userData) => {
            if (!mounted) return;
            
            // Handle potentially missing data
            if (!userData) {
              console.log("No user data found for ID:", session.user.id);
              setIsLoading(false);
              return;
            }
            
            // Ensure role is a valid type
            const validRole: 'buyer' | 'producer' | 'admin' = 
              (userData.role === 'buyer' || userData.role === 'producer' || userData.role === 'admin') 
                ? userData.role 
                : 'buyer';
            
            // Ensure status is a valid type
            const validStatus: 'active' | 'inactive' =
              userData.status === 'active' || userData.status === 'inactive'
                ? userData.status
                : 'inactive';

            // Merge the user data with the auth data
            const enrichedUser: User = {
              ...mappedUser,
              role: validRole,
              status: validStatus,
              full_name: userData.full_name || '',
              country: userData.country || '',
            };

            setUser(enrichedUser);
            setAuthError(null);
            
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
            setIsLoading(false);
          });
        }, 100);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthError(null);
        setIsLoading(false);
        setHasShownError(false); // Reset error flag on sign out
        
        // Reset currency based on location for logged out users or saved preference
        const currency = getCurrencyFromLocalStorage();
        setCurrency(currency);
      }
    });

    // THEN check for existing session
    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [retryCount, hasShownError]);

  return {
    user,
    setUser,
    currency,
    setCurrency,
    isLoading,
    setIsLoading,
    authError,
    setAuthError,
    appVersion,
  };
};
