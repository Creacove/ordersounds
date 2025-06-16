
import { useState, useEffect } from 'react';
import { useCartLightweight } from './useCartLightweight';
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';

interface CartItemWithDetails {
  beatId: string;
  licenseType: string;
  addedAt: string;
  beat?: Beat;
}

export function useCartWithBeatDetails() {
  const { cartItems: lightweightItems, itemCount, removeFromCart, clearCart, addToCart } = useCartLightweight();
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState<CartItemWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  // Fetch beat details for cart items
  useEffect(() => {
    const fetchBeatDetails = async () => {
      if (lightweightItems.length === 0) {
        setCartItemsWithDetails([]);
        setTotalAmount(0);
        return;
      }

      setIsLoading(true);
      try {
        const beatIds = lightweightItems.map(item => item.beatId);
        
        const { data: beats, error } = await supabase
          .from('beats')
          .select(`
            id,
            title,
            producer_id,
            cover_image,
            basic_license_price_local,
            basic_license_price_diaspora,
            premium_license_price_local,
            premium_license_price_diaspora,
            exclusive_license_price_local,
            exclusive_license_price_diaspora,
            genre,
            users!beats_producer_id_fkey (
              wallet_address,
              stage_name,
              full_name
            )
          `)
          .in('id', beatIds);

        if (error) {
          console.error('Error fetching beat details:', error);
          return;
        }

        // Map lightweight items with beat details
        const itemsWithDetails = lightweightItems.map(item => {
          const beat = beats?.find(b => b.id === item.beatId);
          if (!beat) return null;

          const userData = beat.users;
          const producerName = userData?.stage_name || userData?.full_name || 'Unknown Producer';
          
          return {
            beatId: item.beatId,
            licenseType: item.licenseType,
            addedAt: item.addedAt,
            beat: {
              id: beat.id,
              title: beat.title,
              producer_id: beat.producer_id,
              producer_name: producerName,
              cover_image_url: beat.cover_image || '',
              preview_url: '',
              full_track_url: '',
              genre: beat.genre || '',
              track_type: 'Beat',
              bpm: 0,
              tags: [],
              created_at: new Date().toISOString(),
              favorites_count: 0,
              purchase_count: 0,
              status: 'published' as const,
              basic_license_price_local: beat.basic_license_price_local || 0,
              basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
              premium_license_price_local: beat.premium_license_price_local || 0,
              premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
              exclusive_license_price_local: beat.exclusive_license_price_local || 0,
              exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
              selected_license: item.licenseType,
              producer_wallet_address: userData?.wallet_address
            } as Beat
          };
        }).filter((item): item is CartItemWithDetails => item !== null);

        setCartItemsWithDetails(itemsWithDetails);

        // Calculate total amount
        const total = itemsWithDetails.reduce((sum, item) => {
          if (!item.beat) return sum;
          
          const licenseType = item.licenseType;
          let price = 0;
          
          if (licenseType === 'basic') {
            price = item.beat.basic_license_price_diaspora || 0;
          } else if (licenseType === 'premium') {
            price = item.beat.premium_license_price_diaspora || 0;
          } else if (licenseType === 'exclusive') {
            price = item.beat.exclusive_license_price_diaspora || 0;
          }
          
          return sum + price;
        }, 0);
        
        setTotalAmount(total);
      } catch (error) {
        console.error('Error fetching beat details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeatDetails();
  }, [lightweightItems]);

  return {
    cartItems: cartItemsWithDetails,
    itemCount,
    totalAmount,
    isLoading,
    removeFromCart,
    clearCart,
    addToCart
  };
}
