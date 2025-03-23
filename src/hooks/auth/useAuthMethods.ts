import { useState } from 'react';
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
      
      // First, try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Special handling for the "Email not confirmed" error
        if (error.message === "Email not confirmed" || error.code === "email_not_confirmed") {
          console.log("Email not confirmed, attempting to auto-confirm and retry login");
          
          // Try to force confirm the email with a workaround
          const { data: sessionData, error: updateError } = await supabase.auth.updateUser({
            data: { email_confirmed: true }
          });
          
          if (updateError) {
            console.log("Failed to auto-confirm, sending confirmation email:", updateError);
            
            // If the update fails, try to resend the confirmation email
            const { error: resendError } = await supabase.auth.resend({
              type: 'signup',
              email,
            });
            
            if (resendError) {
              throw resendError;
            }
            
            toast.error("Your email is not confirmed. A new confirmation email has been sent.");
            throw new Error("Please check your email and confirm your account before logging in.");
          }
          
          // If we successfully updated the user, try to log in again
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
        }
        
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
      
      // Step 1: Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
            country: 'Nigeria', // Default, can be updated in profile settings
          },
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) {
        console.error("Signup auth error:", error);
        toast.error(error.message);
        throw error;
      }

      console.log("Auth signup successful:", data);
      
      if (data?.user) {
        // Step 2: Create user record in the users table
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

        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        setCurrency(mappedUser.default_currency || 'NGN');
        
        toast.success('Account created successfully! Please check your email to confirm your registration.');
        
        // Redirect based on role
        if (role === 'producer') {
          navigate('/producer/dashboard');
        } else {
          navigate('/');
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
