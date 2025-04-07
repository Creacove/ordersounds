export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'producer' | 'admin';
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at?: string;
  country?: string;
  producer_name?: string; // For producers only
  default_currency?: 'NGN' | 'USD';
  bank_code?: string;
  account_number?: string;
  verified_account_name?: string;
  paystack_subaccount_code?: string;
  paystack_split_code?: string;
  settings?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    [key: string]: any;
  };
  // Add full_name for consistency with database schema
  full_name?: string;
  stage_name?: string;
  follower_count?: number;
  // Add status field
  status?: 'active' | 'inactive';
}

export interface Beat {
  id: string;
  title: string;
  producer_id: string;
  producer_name: string;
  cover_image_url: string;
  preview_url: string;
  full_track_url: string;
  genre: string;
  track_type: string;
  bpm: number;
  tags: string[];
  description?: string;
  created_at: string;
  updated_at?: string;
  favorites_count: number;
  purchase_count: number;
  status: 'draft' | 'published';
  is_featured?: boolean;
  license_type?: 'basic' | 'premium' | 'exclusive' | string;
  license_terms?: string;
  basic_license_price_local?: number;
  basic_license_price_diaspora?: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  custom_license_price_local?: number;
  custom_license_price_diaspora?: number;
  plays?: number;
  key?: string; // Added key property to the Beat interface
  duration?: string; // Added duration property to the Beat interface
  // Add producer field to represent the joined user data
  producer?: {
    full_name?: string;
    stage_name?: string;
  };
  // For backward compatibility with existing code
  users?: {
    full_name?: string;
    stage_name?: string;
  };
}

export interface Playlist {
  id: string;
  name: string; 
  owner_id: string;
  cover_image?: string;
  is_public: boolean;
  beats: string[]; // Array of beat IDs
  created_at: string;
  updated_at?: string;
}

export interface PlaylistBeat {
  playlist_id: string;
  beat_id: string;
  added_at: string;
}

export interface FavoriteBeat {
  user_id: string;
  beat_id: string;
  added_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  total_amount: number;
  currency: 'NGN' | 'USD';
  payment_provider: 'Paystack' | 'Stripe';
  transaction_reference: string;
  contract_consent_at: string;
  created_at: string;
}

export interface PurchasedBeat {
  purchase_id: string;
  beat_id: string;
  amount: number;
  currency: 'NGN' | 'USD';
}

export interface RoyaltySplit {
  id: string;
  beat_id: string;
  beat_title: string;
  beat_cover_image: string | null;
  collaborator_id: string;
  collaborator_name: string;
  collaborator_email: string;
  collaborator_role: string;
  percentage: number;
  created_at: string;
}

export interface CartItem {
  beat: Beat;
  added_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  notification_type: 'info' | 'success' | 'warning' | 'error' | string;
  is_read: boolean;
  created_date: string;
  related_entity_id?: string;
  related_entity_type?: string;
  sender_id?: string;
}
