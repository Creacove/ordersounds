
import { useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { mapSupabaseUser } from "@/lib/supabase";
import { toast } from "sonner";

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  currency: "NGN" | "USD";
}

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currency, setCurrency] = useState<"NGN" | "USD">("NGN");
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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
          setTimeout(() => fetchUserData(userId, onSuccess), 1000); // Retry after 1 second
          return;
        }
        
        throw userError;
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Call success handler if data was retrieved
      if (userData) {
        onSuccess(userData);
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
      if (retryCount >= maxRetries) {
        toast.error("Unable to load user data. Please refresh the page.");
      }
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
          if (mounted) setIsLoading(false);
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
                full_name: userData.full_name,
                country: userData.country,
              };

              setUser(enrichedUser);

              const currency = getCurrencyFromLocalStorage();
              setCurrency(currency);
              
              // Finally set loading to false
              setIsLoading(false);
            });
          }, 0);
        } else {
          if (mounted) {
            setIsLoading(false);
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
          }
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (mounted) setIsLoading(false);
      }
    };

    // Then set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (!mounted) return;

      if (session?.user && event !== 'SIGNED_OUT') {
        const mappedUser = mapSupabaseUser(session.user);
        
        // Set the basic user immediately to avoid UI flicker
        setUser(mappedUser);
        
        // Then fetch additional data after a slight delay to avoid race conditions
        setTimeout(async () => {
          if (!mounted) return;
          
          fetchUserData(session.user.id, (userData) => {
            if (!mounted) return;
            
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
              full_name: userData.full_name,
              country: userData.country,
            };

            setUser(enrichedUser);
            
            const currency = getCurrencyFromLocalStorage();
            setCurrency(currency);
            setIsLoading(false);
          });
        }, 200); // Small delay to avoid race conditions
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsLoading(false);
        
        // Reset currency based on location for logged out users or saved preference
        const currency = getCurrencyFromLocalStorage();
        setCurrency(currency);
      }
    });

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [retryCount]);

  return {
    user,
    setUser,
    currency,
    setCurrency,
    isLoading,
    setIsLoading,
  };
};
