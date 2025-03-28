
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';

// Add type declaration for the PaystackPop object on window
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
  const { cartItems, clearCart } = useCart(); // Get cartItems directly from context
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
      
      // Check if cart is empty using the cartItems from context
      if (!cartItems || cartItems.length === 0) {
        setValidationError('Your cart is empty');
        return false;
      }

      // Verify that the beats in the cart are still available
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

      // Check if any beats are no longer available
      const availableBeats = beatsData.filter(beat => beat.status === 'published');
      if (availableBeats.length !== beatIds.length) {
        const unavailableBeats = beatIds.filter(
          id => !availableBeats.some(beat => beat.id === id)
        );
        
        setValidationError(`Some beats in your cart are no longer available (${unavailableBeats.length} items)`);
        return false;
      }

      // Check if user already purchased any of these beats
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
      // Generate a unique transaction reference
      const reference = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Store cart items in localStorage for verification
      localStorage.setItem('orderItems', JSON.stringify(cartItems));
      localStorage.setItem('paystackReference', reference);
      localStorage.setItem('paystackAmount', totalAmount.toString());
      localStorage.setItem('paymentInProgress', 'true');
      localStorage.setItem('redirectToLibrary', 'true');
      localStorage.setItem('purchaseTime', Date.now().toString());
      
      // Console log for debugging
      console.log('Starting Paystack payment with:', {
        reference,
        amount: totalAmount,
        email: user?.email,
        cartItems: cartItems
      });
      
      // Start PayStack checkout
      const config = {
        key: 'pk_test_051838077ef7c318ce2297471ccc9a8da1e3dfe7',
        email: user?.email || '',
        amount: totalAmount * 100, // convert to kobo
        currency: 'NGN',
        ref: reference,
        label: 'OrderSOUNDS',
        onClose: () => {
          setIsProcessing(false);
          localStorage.removeItem('paymentInProgress');
          onClose();
        },
        callback: (response) => {
          console.log('Payment complete! Response:', response);
          
          // Verify payment on the server
          const verifyResult = verifyPayment(response.reference);
          
          if (typeof verifyResult === 'object' && verifyResult.error) {
            console.error('Payment verification failed:', verifyResult.error);
            toast.error('Payment verification failed. Please contact support.');
            setIsProcessing(false);
            return;
          }
          
          // Handle successful payment
          setIsProcessing(false);
          
          // Important: Call onSuccess to trigger the cart clearing
          onSuccess(response.reference);

          // Add a small delay before redirect to ensure all state updates have time to complete
          setTimeout(() => {
            window.location.href = '/library';
          }, 1000);
        }
      };
      
      // Initialize paystack 
      const handler = window.PaystackPop.setup(config);
      handler.openIframe();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
    }
  }, [isProcessing, isValidating, onClose, onSuccess, totalAmount, user, validateCartItems, cartItems]);

  const verifyPayment = (reference: string) => {
    try {
      // Set verification flags
      localStorage.setItem('pendingVerification', 'true');
      localStorage.setItem('purchaseSuccess', 'true');
      localStorage.setItem('paystackReference', reference);
      
      // Log verification
      console.log(`Verifying payment with reference: ${reference}`);
      
      return true;
    } catch (error) {
      console.error('Payment verification error:', error);
      return { error };
    }
  };

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
