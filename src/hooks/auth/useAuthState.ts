
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

          // Get user data in a setTimeout to avoid deadlocks with auth state changes
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              // Get additional user data from the users table, including status
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, status, full_name, country")
                .eq("id", data.session.user.id)
                .maybeSingle();

              if (!mounted) return;

              if (userError) {
                console.error("Error fetching user data:", userError);
                setUser(mappedUser);
              } else if (userData) {
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
              } else {
                setUser(mappedUser);
                const defaultCurrency = getCurrencyFromLocalStorage();
                setCurrency(defaultCurrency);
              }
            } catch (error) {
              console.error("Error processing user data:", error);
              if (mounted) {
                setUser(mappedUser);
              }
            } finally {
              if (mounted) setIsLoading(false);
            }
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
        
        // Then fetch additional data
        setTimeout(async () => {
          if (!mounted) return;
          
          try {
            // Get additional user data from the users table, including status
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("role, status, full_name, country")
              .eq("id", session.user.id)
              .maybeSingle();

            if (!mounted) return;

            if (userError) {
              console.error("Error fetching user data:", userError);
            } else if (userData) {
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
            }
          } catch (error) {
            console.error("Error in auth state change:", error);
          } finally {
            setIsLoading(false);
          }
        }, 0);
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
  }, []);

  return {
    user,
    setUser,
    currency,
    setCurrency,
    isLoading,
    setIsLoading,
  };
};
