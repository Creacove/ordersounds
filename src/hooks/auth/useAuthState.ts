
import { useState, useEffect } from "react";
import { User } from "@/types";
import { supabase } from "@/lib/supabase";
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
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.id);

      if (session?.user) {
        try {
          const mappedUser = mapSupabaseUser(session.user);

          // To prevent deadlocks, use setTimeout for additional Supabase calls
          setTimeout(async () => {
            try {
              // Get additional user data from the users table, including status
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("role, status, full_name, country")
                .eq("id", session.user.id)
                .maybeSingle();

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
              setUser(mappedUser);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } catch (error) {
          console.error("Error in auth state change:", error);
          setIsLoading(false);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);

        // Reset currency based on location for logged out users or saved preference
        setTimeout(async () => {
          const currency = getCurrencyFromLocalStorage();
          setCurrency(currency);
          setIsLoading(false);
        }, 0);
      }
    });

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
            .from("users")
            .select("role, status, full_name, country")
            .eq("id", data.session.user.id)
            .maybeSingle();

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
        }
      } catch (error) {
        console.error("Session check error:", error);
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
    setIsLoading,
  };
};
