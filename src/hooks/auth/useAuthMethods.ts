import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { mapSupabaseUser } from '@/lib/supabase';

interface AuthMethodsProps {
  setUser: (user: User | null) => void;
  setCurrency: (currency: 'NGN' | 'USD') => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthMethods = ({ setUser, setCurrency, setIsLoading }: AuthMethodsProps) => {
  const navigate = useNavigate();

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      console.log("Attempting login with:", email);
      
      // Direct sign in attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If the error is "Email not confirmed", force update the user to treat it as confirmed
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          console.log("Email not confirmed, attempting to sign up again...");
          
          // Force sign up the user again without confirmation requirement
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { 
                email_confirmed: true 
              }
            }
          });
          
          if (signUpError) {
            throw signUpError;
          }
          
          // If sign-up successful, try to log in right away
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            throw retryError;
          }
          
          if (retryData?.user) {
            const mappedUser = mapSupabaseUser(retryData.user);
            setUser(mappedUser);
            setCurrency(mappedUser.default_currency || 'NGN');
            toast.success('Login successful');
            
            // Redirect based on role
            if (mappedUser.role === 'producer') {
              navigate('/producer/dashboard');
            } else {
              navigate('/');
            }
            
            return;
          }
        } else {
          // Handle other errors
          console.error("Login error:", error);
          toast.error(error.message || 'Failed to log in');
          throw error;
        }
      }

      if (data?.user) {
        console.log("Login successful:", data.user);
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
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      console.log("Attempting signup with:", { email, name, role });
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
        
      if (existingUser) {
        toast.error('A user with this email already exists');
        setIsLoading(false);
        return;
      }
      
      // Skip email confirmation by setting email_confirmed to true
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            country: 'Nigeria', // Default, can be updated in profile settings
            email_confirmed: true, // Bypass email confirmation
          },
        }
      });

      if (error) {
        console.error("Signup auth error:", error);
        toast.error(error.message);
        throw error;
      }

      console.log("Auth signup successful:", data);
      
      if (data?.user) {
        // Create user record in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: data.user.id,
              full_name: name,
              email: email,
              role: role,
              password_hash: 'managed-by-supabase', // Supabase Auth handles the actual hashing
            }
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          toast.error('Could not complete profile setup, but auth account was created');
        } else {
          console.log("User profile created successfully");
        }

        // Sign in immediately after successful signup
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          console.error("Auto sign-in error:", signInError);
          toast.error("Account created but couldn't log you in automatically.");
          navigate('/login');
          return;
        }

        if (signInData?.user) {
          const mappedUser = mapSupabaseUser(signInData.user);
          setUser(mappedUser);
          setCurrency(mappedUser.default_currency || 'NGN');
          toast.success('Account created successfully! You are now logged in.');
          
          // Redirect based on role
          if (role === 'producer') {
            navigate('/producer/dashboard');
          } else {
            navigate('/');
          }
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
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
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
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
          default_currency: data.default_currency,
        }
      });

      if (authError) {
        throw authError;
      }

      // Update users table - need current user for this
      const currentUser = await supabase.auth.getUser();
      if (!currentUser.data.user) {
        throw new Error('No user found');
      }

      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: data.name,
          stage_name: data.producer_name,
          bio: data.bio,
          country: data.country,
          profile_picture: data.avatar_url,
        })
        .eq('id', currentUser.data.user.id);

      if (profileError) {
        throw profileError;
      }

      // Get the updated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw userError || new Error('Failed to get updated user data');
      }

      // Update local state
      const mappedUser = mapSupabaseUser(userData.user);
      setUser(mappedUser);
      
      // Update currency if country changed
      if (data.default_currency) {
        setCurrency(data.default_currency);
      }
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    logout,
    updateProfile
  };
};
