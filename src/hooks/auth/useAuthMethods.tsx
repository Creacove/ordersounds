
// This is a new file we need to create with specific status handling for producers

import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { mapSupabaseUser } from '@/lib/supabase';
import { uniqueToast } from '@/lib/toast';

interface AuthMethodsProps {
  setUser: (user: User | null) => void;
  setCurrency: (currency: 'NGN' | 'USD') => void;
  setIsLoading: (isLoading: boolean) => void;
  setAuthError: (error: string | null) => void;
  appVersion: {
    current: string;
    previous: string | null;
    hasChanged: boolean;
  };
}

export const useAuthMethods = ({
  setUser,
  setCurrency,
  setIsLoading,
  setAuthError,
  appVersion
}: AuthMethodsProps) => {
  const navigate = useNavigate();
  const [tokenRefreshAttempted, setTokenRefreshAttempted] = useState(false);

  // Helper to log authentication events
  const logAuthEvent = async (event: string, details: any = {}) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;
      const eventData = {
        event_type: event,
        user_id: userId || 'anonymous',
        details: JSON.stringify({
          ...details,
          app_version: appVersion.current,
          timestamp: new Date().toISOString(),
        }),
        created_at: new Date().toISOString()
      };

      // Store in Supabase (assuming an auth_logs table exists)
      await supabase.from('auth_logs').insert([eventData]);
    } catch (error) {
      // Silent error - don't break the app if logging fails
      console.error('Failed to log auth event:', error);
    }
  };

  // Function to refresh the session using refresh token
  const refreshSession = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      if (tokenRefreshAttempted) {
        console.log('Token refresh already attempted, skipping to prevent loop');
        return false;
      }

      setTokenRefreshAttempted(true);
      console.log('Attempting to refresh session...');
      
      // Try to refresh the token using Supabase's built-in refresh mechanism
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        setAuthError(`[silent] Refresh session failed: ${error.message}`);
        
        // If version changed, show a helpful message
        if (appVersion.hasChanged) {
          uniqueToast.error('Please login again due to a recent update');
        }
        
        logAuthEvent('refresh_failed', { error: error.message });
        return false;
      }
      
      if (data?.session && data?.user) {
        console.log('Session refreshed successfully');
        
        // Map the user data
        const mappedUser = mapSupabaseUser(data.user);
        setUser(mappedUser);
        
        logAuthEvent('refresh_success', { 
          provider: data.user.app_metadata.provider || 'email',
          user_id: data.user.id
        });
        
        return true;
      } else {
        console.log('No session data returned');
        setAuthError('[silent] No session data returned from refresh');
        return false;
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      setAuthError(`[silent] Error in refresh session: ${error.message}`);
      logAuthEvent('refresh_exception', { error: error.message });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setAuthError(null);
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
          uniqueToast.error("Email not confirmed. Please check your inbox for a confirmation email or try signing up again.");
          setIsLoading(false);
          setAuthError(`Email not confirmed: ${error.message}`);
          logAuthEvent('login_email_unconfirmed', { email });
          return;
        }
        
        uniqueToast.error(error.message || 'Failed to log in');
        setIsLoading(false);
        setAuthError(`Login failed: ${error.message}`);
        logAuthEvent('login_failed', { error: error.message, email });
        return;
      }

      if (data?.user) {
        console.log("Login successful:", data.user.id);
        logAuthEvent('login_success', { 
          provider: 'email', 
          user_id: data.user.id 
        });
        
        // Redirect to callback which will handle role/status routing
        navigate('/auth/callback');
        return;
      }
      
      uniqueToast.error("Failed to login. Please try again.");
      setAuthError('Login failed: No user data returned');
      logAuthEvent('login_no_user_data', { email });
      
    } catch (error: any) {
      console.error('Login error:', error);
      uniqueToast.error(error.message || 'Failed to log in');
      setAuthError(`Login error: ${error.message}`);
      logAuthEvent('login_exception', { error: error.message, email });
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    setIsLoading(true);
    try {
      setAuthError(null);
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
        setAuthError('Signup failed: User already exists');
        logAuthEvent('signup_user_exists', { email });
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
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error("Signup auth error:", error);
        toast.error(error.message);
        setIsLoading(false);
        setAuthError(`Signup failed: ${error.message}`);
        logAuthEvent('signup_failed', { error: error.message, email });
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
          setAuthError(`User profile creation failed: ${profileError.message}`);
          logAuthEvent('signup_profile_failed', { 
            error: profileError.message, 
            user_id: data.user.id
          });
        } else {
          console.log("User profile created successfully");
          toast.success('Account created successfully!');
          logAuthEvent('signup_success', { 
            user_id: data.user.id,
            role: role
          });
          
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
            logAuthEvent('signup_auto_login', { user_id: signInData.user.id });
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
      setAuthError(`Signup error: ${error.message}`);
      logAuthEvent('signup_exception', { error: error.message, email });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      
      // Get user ID before signing out for logging
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
      toast.success('Logged out successfully');
      logAuthEvent('logout_success', { user_id: userId });
      navigate('/login');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Failed to logout');
      setAuthError(`Logout failed: ${error.message}`);
      logAuthEvent('logout_failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    setIsLoading(true);
    try {
      setAuthError(null);
      
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
      logAuthEvent('profile_updated', { user_id: userData.user.id });
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Failed to update profile');
      setAuthError(`Profile update failed: ${error.message}`);
      logAuthEvent('profile_update_failed', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    signup,
    logout,
    updateProfile,
    refreshSession
  };
};
