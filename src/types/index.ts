export type User = {
  id: string;
  email: string;
  role: string;
  name: string;
  avatar_url: string;
  bio: string;
  created_at: string;
  updated_at: string;
  country: string;
  producer_name: string;
  default_currency: string;
};

export type Beat = {
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
  description: string;
  created_at: string;
  updated_at: string;
  favorites_count: number;
  purchase_count: number;
  status: string;
  is_featured: boolean;
  license_type: string;
  license_terms: string;
  basic_license_price_local: number;
  basic_license_price_diaspora: number;
  premium_license_price_local: number;
  premium_license_price_diaspora: number;
  exclusive_license_price_local: number;
  exclusive_license_price_diaspora: number;
  plays: number;
  key: string;
  duration: string;
  producer?: any;
  users?: any;
};

export type Notification = {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  notification_type: string;
  related_entity_id: string | null;
  related_entity_type: string | null;
  is_read: boolean;
  created_date: string;
  sender_id: string | null;
};

export type Order = {
  id: string;
  buyer_id: string;
  order_date: string;
  total_price: number;
  currency_used: string;
  payment_method: string;
  payment_reference: string | null;
  status: string;
  consent_timestamp: string | null;
  split_code: string | null;
};

export type LineItem = {
  id: string;
  order_id: string;
  beat_id: string;
  price_charged: number;
  currency_code: string;
  quantity: number | null;
};

export type Payment = {
  id: string;
  order_id: string;
  amount: number;
  payment_method: string;
  payment_date: string;
  status: string;
  transaction_reference: string | null;
  payment_details: any | null;
  producer_share: number | null;
  platform_share: number | null;
};

export type UserPurchasedBeat = {
  id: string;
  user_id: string;
  beat_id: string;
  order_id: string;
  purchase_date: string;
  currency_code: string;
  license_type: string | null;
};

export type ProducerStats = {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueChange: number;
  beatsSold: number;
  salesChange: number;
};

export type RoyaltySplit = {
  id: string;
  beat_id: string;
  beat_title: string;
  beat_cover_image: string | null;
  collaborator_name: string;
  collaborator_email: string;
  collaborator_role: string;
  percentage: number;
  created_at?: string;
};
