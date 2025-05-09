
import { createClient } from '@supabase/supabase-js';
import { User, Beat } from '@/types';
import { SupabaseBeat } from '@/services/beats/types';

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

// Add a helper function to map database beat objects to Beat interface
export const mapSupabaseBeat = (beat: SupabaseBeat): Beat => {
  // Get producer name with proper fallbacks
  const getProducerName = (): string => {
    if (beat.users) {
      if (typeof beat.users === 'object') {
        if (beat.users.stage_name) return beat.users.stage_name;
        if (beat.users.full_name) return beat.users.full_name;
      }
    }
    
    // Fallback to direct properties
    if (beat.producer_id) return `Producer ${beat.producer_id.substring(0, 8)}`;
    
    return 'Unknown Producer';
  };

  return {
    id: beat.id,
    title: beat.title || '',
    producer_id: beat.producer_id || '',
    producer_name: getProducerName(),
    cover_image_url: beat.cover_image || '',
    preview_url: beat.audio_preview || '',
    full_track_url: beat.audio_file || '',
    genre: beat.genre || '',
    track_type: beat.track_type || '',
    bpm: beat.bpm || 0,
    tags: beat.tags || [],
    description: beat.description || '',
    created_at: beat.upload_date || new Date().toISOString(),
    updated_at: '',
    favorites_count: beat.favorites_count || 0,
    purchase_count: beat.purchase_count || 0,
    status: (beat.status as 'draft' | 'published') || 'published',
    is_featured: beat.is_featured || false,
    license_type: beat.license_type || '',
    license_terms: '',
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local || 0,
    premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
    exclusive_license_price_local: beat.exclusive_license_price_local || 0,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
    plays: beat.plays || 0,
    key: beat.key || '',
    duration: '',
    // Preserve the original producer object for context
    producer: beat.users
  };
};

// Helper function to convert an array of database beats to our Beat interface
export const mapSupabaseBeats = (beats: SupabaseBeat[]): Beat[] => {
  if (!beats || !Array.isArray(beats)) return [];
  return beats.map(mapSupabaseBeat);
};
