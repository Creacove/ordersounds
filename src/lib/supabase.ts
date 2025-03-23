
import { createClient } from '@supabase/supabase-js';
import { User } from '@/types';

// Supabase URL and anon key are safe to be in the client
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseAnonKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const mapSupabaseUser = (user: any): User => {
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
    default_currency: user.user_metadata?.country === 'Nigeria' ? 'NGN' : 'USD',
  };
};
