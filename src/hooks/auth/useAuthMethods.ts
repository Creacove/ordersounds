import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
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
      
      // Direct sign-in attempt
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error("Login error:", error);
        
        // Special case for unconfirmed emails
        if (error.message.includes("Email not confirmed") || error.code === "email_not_confirmed") {
          toast.error("Email not confirmed. Please check your inbox for a confirmation email or try signing up again.");
          setIsLoading(false);
          return;
        }
        
        toast.error(error.message || 'Failed to log in');
        setIsLoading(false);
        return;
      }

      if (data?.user) {
        console.log("Login successful:", data.user.id);
        // Redirect to callback which will handle role/status routing
        navigate('/auth/callback');
        return;
      }
      
      toast.error("Failed to login. Please try again.");
      
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in');
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
      
      // Create the auth account
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            country: 'Nigeria', // Default, can be updated in profile settings
          },
        }
      });

      if (error) {
        console.error("Signup auth error:", error);
        toast.error(error.message);
        setIsLoading(false);
        return;
      }

      console.log("Auth signup successful:", data);
      
      if (data?.user) {
        // Create user record in the users table
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            full_name: name,
            email: email,
            role: role,
            // Set status for producers to inactive by default
            status: role === 'producer' ? 'inactive' : 'active',
            // Add the required password_hash field
            password_hash: 'managed-by-supabase'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          toast.error('Could not complete profile setup, but auth account was created');
        } else {
          console.log("User profile created successfully");
          toast.success('Account created successfully!');
          
          // Try to sign in immediately
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (signInError) {
            console.log("Couldn't auto-login, redirecting to login page");
            toast.info("Please check your email to verify your account, then log in");
            navigate('/login');
            return;
          }
          
          if (signInData?.user) {
            console.log("Auto-login successful, redirecting to callback");
            navigate('/auth/callback');
            return;
          }
        }
        
        // Default fallback - redirect to login
        toast.info("Account created! Please log in to continue.");
        navigate('/login');
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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      // Update user metadata in auth.users
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: data.name,
          stage_name: data.producer_name,
          bio: data.bio,
          country: data.country,
          profile_picture: data.avatar_url,
          default_currency: data.default_currency,
          role: data.role,
        }
      });

      if (authError) {
        throw authError;
      }

      // Get the current user session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw userError || new Error('No user found');
      }

      // Check if user exists in the users table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // If user exists, update; otherwise insert
      if (existingUser) {
        // Update users table
        const { error: profileError } = await supabase
          .from('users')
          .update({
            full_name: data.name,
            stage_name: data.producer_name,
            bio: data.bio,
            country: data.country,
            profile_picture: data.avatar_url,
            role: data.role,
          })
          .eq('id', userData.user.id);

        if (profileError) {
          throw profileError;
        }
      } else {
        // Insert new user record
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            {
              id: userData.user.id,
              full_name: data.name || userData.user.user_metadata?.full_name || '',
              email: userData.user.email || '',
              role: data.role || 'buyer',
              password_hash: 'managed-by-supabase',
              profile_picture: data.avatar_url || userData.user.user_metadata?.avatar_url || '',
              bio: data.bio || userData.user.user_metadata?.bio || '',
              country: data.country || userData.user.user_metadata?.country || 'Nigeria',
              stage_name: data.producer_name || userData.user.user_metadata?.stage_name || '',
            }
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      // Get the updated user
      const { data: updatedUserData, error: updatedUserError } = await supabase.auth.getUser();
      if (updatedUserError || !updatedUserData.user) {
        throw updatedUserError || new Error('Failed to get updated user data');
      }

      // Update local state
      const mappedUser = mapSupabaseUser(updatedUserData.user);
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
