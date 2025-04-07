
// This is a new file we need to create with specific status handling for producers

import { useState } from 'react';
import { User } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface AuthMethodsProps {
  setUser: (user: User | null) => void;
  setCurrency: (currency: 'NGN' | 'USD') => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthMethods = ({ 
  setUser, 
  setCurrency, 
  setIsLoading 
}: AuthMethodsProps) => {
  const navigate = useNavigate();
  
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Redirect to auth callback which will handle navigation based on role
      navigate('/auth/callback');
      
    } catch (error: any) {
      toast.error(error.message);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string, role: 'buyer' | 'producer') => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data && data.user) {
        // Create user profile record
        const { error: profileError } = await supabase.from('users').insert({
          id: data.user.id,
          email: email,
          full_name: name,
          role: role,
          status: role === 'producer' ? 'inactive' : 'active', // Producers are inactive by default
          created_at: new Date().toISOString(),
        });

        if (profileError) {
          toast.error(`Error creating user profile: ${profileError.message}`);
          throw profileError;
        }

        // Redirect to auth callback to handle role-based navigation
        navigate('/auth/callback');
      }
    } catch (error: any) {
      toast.error(error.message);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear user and redirect to home page
      setUser(null);
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser || !authUser.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', authUser.user.id);

      if (error) {
        throw error;
      }

      // Update the local user object with the new data
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.user.id)
        .single();

      if (updatedUser) {
        setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : null);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(`Error updating profile: ${error.message}`);
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
