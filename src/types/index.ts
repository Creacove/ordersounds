

export interface User {
  id: string;
  email: string;
  role: 'buyer' | 'producer';
  name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at?: string;
  country?: string;
  producer_name?: string; // For producers only
  default_currency?: 'NGN' | 'USD';
}

export interface Beat {
  id: string;
  title: string;
  producer_id: string;
  producer_name: string;
  cover_image_url: string;
  preview_url: string;
  full_track_url: string;
  price_local: number; // NGN
  price_diaspora: number; // USD
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
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  created_at: string;
}
