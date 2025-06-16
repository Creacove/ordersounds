
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';
import { SupabaseBeat } from '@/services/beats/types';

interface PurchasedBeatData {
  beats: Beat[];
  purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }>;
}

export async function fetchPurchasedBeatsOptimized(userId: string): Promise<PurchasedBeatData> {
  console.log('Fetching purchased beats optimized for user:', userId);
  
  try {
    // Single optimized query using JOIN to get all data at once
    const { data, error } = await supabase
      .from('user_purchased_beats')
      .select(`
        beat_id,
        license_type,
        purchase_date,
        beats:beat_id (
          id,
          title,
          producer_id,
          producer_name:users!beats_producer_id_fkey(stage_name),
          cover_image_url:cover_image,
          preview_url:audio_preview,
          full_track_url:audio_file,
          stems_url,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          bpm,
          genre,
          track_type,
          tags,
          upload_date,
          plays,
          purchase_count,
          favorites_count,
          status
        )
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching purchased beats:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('No purchased beats found');
      return { beats: [], purchaseDetails: {} };
    }

    // Transform data efficiently in a single pass
    const beats: Beat[] = [];
    const purchaseDetails: Record<string, { licenseType: string, purchaseDate: string }> = {};

    data.forEach(item => {
      if (item.beats) {
        const beat = mapSupabaseBeatToBeat(item.beats as SupabaseBeat);
        beats.push(beat);
        
        purchaseDetails[item.beat_id] = {
          licenseType: item.license_type || 'basic',
          purchaseDate: item.purchase_date
        };
      }
    });

    console.log(`Successfully fetched ${beats.length} purchased beats optimized`);
    return { beats, purchaseDetails };
  } catch (error) {
    console.error('Error in fetchPurchasedBeatsOptimized:', error);
    throw error;
  }
}
