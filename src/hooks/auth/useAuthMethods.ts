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
      
      // First attempt direct sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      // If we get an error about email confirmation
      if (error && (error.message.includes("Email not confirmed") || error.code === "email_not_confirmed")) {
        console.log("Login failed due to email confirmation. Updating user and retrying...");
        
        // 1. First try to update the user in the auth.users table to mark email as confirmed
        const { error: adminUpdateError } = await supabase.rpc('admin_update_user_confirmed', { 
          user_email: email 
        });
        
        if (adminUpdateError) {
          console.log("Admin update failed, trying alternative approach:", adminUpdateError);
          
          // 2. Try direct login again after update attempt
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) {
            // If still failing, let's do a more direct approach
            console.log("Retry login still failed. Attempting to sign up again to get a new session.");
            
            // 3. As a last resort, sign up again but with email_confirmed flag
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
              email,
              password,
              options: {
                data: { 
                  email_confirmed: true
                }
              }
            });
            
            if (signUpError && !signUpError.message.includes("already registered")) {
              throw signUpError;
            }
            
            // Try login one more time
            const { data: finalData, error: finalError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (finalError) {
              throw finalError;
            }
            
            if (finalData?.user) {
              const mappedUser = mapSupabaseUser(finalData.user);
              setUser(mappedUser);
              setCurrency(mappedUser.default_currency || 'NGN');
              
              // Redirect to callback for proper role/status based routing
              navigate('/auth/callback');
              return;
            }
          } else if (retryData?.user) {
            // Retry worked after admin update
            const mappedUser = mapSupabaseUser(retryData.user);
            setUser(mappedUser);
            setCurrency(mappedUser.default_currency || 'NGN');
            
            // Redirect to callback for proper role/status based routing
            navigate('/auth/callback');
            return;
          }
        }
      } else if (error) {
        // Handle other errors
        console.error("Login error:", error);
        toast.error(error.message || 'Failed to log in');
        throw error;
      }

      if (data?.user) {
        console.log("Login successful:", data.user);
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        setCurrency(mappedUser.default_currency || 'NGN');
        
        // Redirect to callback which will handle role/status routing
        navigate('/auth/callback');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to log in');
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
              // Set status for producers to inactive by default
              status: role === 'producer' ? 'inactive' : 'active',
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
          // Update with the status we just set
          mappedUser.status = role === 'producer' ? 'inactive' : 'active';
          setUser(mappedUser);
          setCurrency(mappedUser.default_currency || 'NGN');
          toast.success('Account created successfully! You are now logged in.');
          
          // If producer and inactive, redirect directly to activation
          if (role === 'producer') {
            navigate('/producer-activation');
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
