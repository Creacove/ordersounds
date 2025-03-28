
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface UsePaystackCheckoutProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  totalAmount: number;
}

export function usePaystackCheckout({ onSuccess, onClose, totalAmount }: UsePaystackCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();

  const validateCartItems = useCallback(async () => {
    if (!user) {
      setValidationError('You must be logged in to complete this purchase');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      console.log('Validating cart items:', cartItems);
      
      if (!cartItems || cartItems.length === 0) {
        setValidationError('Your cart is empty');
        return false;
      }

      const beatIds = cartItems.map(item => item.beat.id);
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select('id, status')
        .in('id', beatIds);

      if (beatsError) {
        console.error('Error validating beats:', beatsError);
        setValidationError('Failed to validate your cart items');
        return false;
      }

      const availableBeats = beatsData.filter(beat => beat.status === 'published');
      if (availableBeats.length !== beatIds.length) {
        const unavailableBeats = beatIds.filter(
          id => !availableBeats.some(beat => beat.id === id)
        );
        
        setValidationError(`Some beats in your cart are no longer available (${unavailableBeats.length} items)`);
        return false;
      }

      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id)
        .in('beat_id', beatIds);

      if (purchasedError) {
        console.error('Error checking purchased beats:', purchasedError);
        setValidationError('Failed to validate your previous purchases');
        return false;
      }

      if (purchasedData && purchasedData.length > 0) {
        const alreadyPurchasedTitles = cartItems
          .filter(item => purchasedData.some(p => p.beat_id === item.beat.id))
          .map(item => item.beat.title);
          
        setValidationError(
          `You've already purchased: ${alreadyPurchasedTitles.join(', ')}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error('Cart validation error:', error);
      setValidationError('An error occurred while validating your cart');
      return false;
    } finally {
      setIsValidating(false);
    }
  }, [user, cartItems]);

  const handlePaymentStart = useCallback(async () => {
    if (isProcessing || isValidating) return;
    
    setIsProcessing(true);
    const isValid = await validateCartItems();
    
    if (!isValid) {
      setIsProcessing(false);
      return;
    }

    try {
      if (!window.PaystackPop) {
        console.error('PaystackPop not found. Make sure the script is loaded.');
        toast.error('Payment system not ready. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }
      
      // Generate a unique reference ID
      const reference = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Store cart info for verification
      localStorage.setItem('orderItems', JSON.stringify(cartItems));
      localStorage.setItem('paystackReference', reference);
      localStorage.setItem('paystackAmount', totalAmount.toString());
      localStorage.setItem('paymentInProgress', 'true');
      localStorage.setItem('redirectToLibrary', 'true');
      localStorage.setItem('purchaseTime', Date.now().toString());
      
      console.log('Starting Paystack payment with:', {
        reference,
        amount: totalAmount,
        email: user?.email,
        cartItems: cartItems
      });
      
      // Format cart items for metadata
      const orderItemsMetadata = cartItems.map(item => ({
        beat_id: item.beat.id,
        title: item.beat.title,
        price: item.beat.basic_license_price_local,
        license: item.beat.selected_license || 'basic'
      }));
      
      // Initialize Paystack
      const handler = window.PaystackPop.setup({
        key: 'pk_test_b3ff87016c279c34b015be72594fde728d5849b8', // Public test key
        email: user?.email || '',
        amount: totalAmount * 100, // Convert to kobo
        currency: 'NGN',
        ref: reference,
        label: 'OrderSOUNDS',
        metadata: {
          custom_fields: [
            {
              display_name: "Order Items",
              variable_name: "order_items",
              value: JSON.stringify(orderItemsMetadata)
            }
          ]
        },
        onClose: function() {
          console.log('Payment window closed');
          setIsProcessing(false);
          localStorage.removeItem('paymentInProgress');
          onClose();
        },
        callback: function(response) {
          console.log('Payment complete! Response:', response);
          
          // Verify the payment
          localStorage.setItem('pendingVerification', 'true');
          localStorage.setItem('purchaseSuccess', 'true');
          localStorage.setItem('paystackReference', response.reference);
          
          setIsProcessing(false);
          onSuccess(response.reference);
          
          setTimeout(() => {
            window.location.href = '/library';
          }, 1500);
        }
      });
      
      // Explicitly open the payment iframe
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
    }
  }, [isProcessing, isValidating, onClose, onSuccess, totalAmount, user, validateCartItems, cartItems]);

  const handleRefreshCart = async () => {
    setValidationError(null);
    await validateCartItems();
  };

  return {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart
  };
}
