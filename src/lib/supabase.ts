
import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';

// Use the correct Supabase URL and anon key
const supabaseUrl = 'https://uoezlwkxhbzajdivrlby.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvZXpsd2t4aGJ6YWpkaXZybGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3Mzg5MzAsImV4cCI6MjA1ODMxNDkzMH0.TwIkGiLNiuxTdzbAxv6zBgbK1zIeNkhZ6qeX6OmhWOk';

// Create a single instance of the supabase client to avoid duplicates
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: localStorage,
    flowType: 'implicit',  // Disable email confirmation
    detectSessionInUrl: false, // Don't look for the session in the URL
    autoConfirmEmailOnSignup: true // Try to auto-confirm emails (though this depends on Supabase settings)
  }
});

export const mapSupabaseUser = (user: any): User => {
  // Make sure all required fields exist with default values if needed
  return {
    id: user.id,
    email: user.email || '',
    role: user.user_metadata?.role || 'buyer',
    name: user.user_metadata?.full_name || '',
    avatar_url: user.user_metadata?.profile_picture || '',
    bio: user.user_metadata?.bio || '',
    created_at: user.created_at,
    updated_at: user.updated_at,
    country: user.user_metadata?.country || '',
    producer_name: user.user_metadata?.stage_name || '',
    default_currency: user.user_metadata?.default_currency || (user.user_metadata?.country === 'Nigeria' ? 'NGN' : 'USD'),
  };
};
