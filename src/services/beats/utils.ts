
import { Beat } from '@/types';
import { SupabaseBeat } from './types';

export const mapSupabaseBeatToBeat = (beat: SupabaseBeat): Beat => {
  const userData = beat.users;
  const producerName = userData && userData.stage_name ? userData.stage_name : 
                     userData && userData.full_name ? userData.full_name : 'Unknown Producer';
  
  const status = beat.status === 'published' ? 'published' : 'draft';
  
  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: producerName,
    cover_image_url: beat.cover_image || '',
    preview_url: beat.audio_preview || '',
    full_track_url: beat.audio_file || '',
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local || 0,
    premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
    exclusive_license_price_local: beat.exclusive_license_price_local || 0,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
    custom_license_price_local: beat.custom_license_price_local || 0,
    custom_license_price_diaspora: beat.custom_license_price_diaspora || 0,
    genre: beat.genre || '',
    track_type: beat.track_type || 'Beat',
    bpm: beat.bpm || 0,
    tags: beat.tags || [],
    description: beat.description,
    created_at: beat.upload_date || new Date().toISOString(),
    favorites_count: beat.favorites_count || 0,
    purchase_count: beat.purchase_count || 0,
    status: status,
    is_featured: false,
  };
};
