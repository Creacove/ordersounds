
import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';

// Use the correct Supabase URL and anon key from the integrations folder
import { supabase as integrationClient } from '@/integrations/supabase/client';

// Re-export the client from integrations
export const supabase = integrationClient;

export const mapSupabaseUser = (user: any): User => {
  // Extract the profile image from Google auth if available
  const avatarUrl = 
    user.user_metadata?.profile_picture || 
    user.user_metadata?.avatar_url || 
    '';

  // Map full name from Google auth if available
  const fullName = 
    user.user_metadata?.full_name || 
    user.user_metadata?.name || // Google provides 'name' 
    '';

  // Get the role from metadata or default to 'buyer'
  const role = user.user_metadata?.role || 'buyer';

  // Make sure all required fields exist with default values if needed
  return {
    id: user.id,
    email: user.email || '',
    role: role,
    name: fullName,
    avatar_url: avatarUrl,
    bio: user.user_metadata?.bio || '',
    created_at: user.created_at,
    updated_at: user.updated_at,
    country: user.user_metadata?.country || '',
    producer_name: user.user_metadata?.stage_name || '',
    default_currency: user.user_metadata?.default_currency || (user.user_metadata?.country === 'Nigeria' ? 'NGN' : 'USD'),
  };
};
