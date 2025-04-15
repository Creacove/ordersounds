
import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { createOrder, verifyPaystackPayment } from '@/utils/payment/paystackUtils';

declare global {
  interface Window {
    PaystackPop: any;
  }
}

interface UsePaystackCheckoutProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  totalAmount: number;
  splitCode?: string | null;
  producerId?: string;
  beatId?: string;
}

export function usePaystackCheckout({ 
  onSuccess, 
  onClose, 
  totalAmount,
  splitCode,
  producerId,
  beatId
}: UsePaystackCheckoutProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  
  // Create direct function references to prevent serialization issues
  const paystackCloseRef = useRef(() => {
    console.log('Payment window closed');
    setIsProcessing(false);
    localStorage.removeItem('paymentInProgress');
    onClose();
  });
  
  const paystackSuccessRef = useRef((response: any) => {
    console.log('Payment complete! Response:', response);
    
    const handleSuccess = async () => {
      try {
        const orderId = localStorage.getItem('pendingOrderId');
        const orderItemsStr = localStorage.getItem('orderItems');
        
        if (!orderId || !orderItemsStr) {
          toast.error('Order information missing. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        const orderItemsData = JSON.parse(orderItemsStr);
        
        // Verify the payment with our backend
        const verificationResult = await verifyPaystackPayment(
          response.reference, 
          orderId,
          orderItemsData
        );
        
        if (verificationResult.success) {
          // Process purchased beats immediately
          try {
            // Get the buyer's ID
            if (!user || !user.id) throw new Error('User information missing');
            
            // Add purchased beats directly to prevent waiting for webhook
            for (const item of orderItemsData) {
              // Check if it's already purchased to avoid duplicates
              const { data: existingPurchase, error: checkError } = await supabase
                .from('user_purchased_beats')
                .select('id')
                .eq('user_id', user.id)
                .eq('beat_id', item.beat_id)
                .eq('order_id', orderId)
                .maybeSingle();
                
              if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
                console.error('Error checking for existing purchase:', checkError);
              }
              
              // Skip if already purchased
              if (existingPurchase) continue;
              
              // Insert the purchase
              const { error: purchaseError } = await supabase
                .from('user_purchased_beats')
                .insert({
                  user_id: user.id,
                  beat_id: item.beat_id,
                  license_type: item.license || 'basic',
                  currency_code: 'NGN',
                  order_id: orderId,
                });
                
              if (purchaseError) {
                console.error('Error recording purchase:', purchaseError);
              } else {
                console.log(`Purchase recorded for beat ${item.beat_id}`);
              }
            }
          } catch (err) {
            console.error('Error recording purchases:', err);
            // Continue with redirect even if local recording failed,
            // the webhook will handle it as backup
          }
          
          localStorage.setItem('purchaseSuccess', 'true');
          localStorage.setItem('purchaseTime', Date.now().toString());
          
          // Success! Clear cart and redirect
          clearCart();
          setIsProcessing(false);
          onSuccess(response.reference);
          
          toast.success('Your purchase was successful! Redirecting to your library...');
          
          // Force direct to library instead of using navigate
          setTimeout(() => {
            window.location.href = '/library';
          }, 1500);
        } else {
          console.error('Payment verification failed:', verificationResult.error);
          toast.error('Payment verification failed. Please contact support with your reference number.');
          setIsProcessing(false);
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        toast.error('An error occurred during payment processing');
        setIsProcessing(false);
      }
    };
    
    handleSuccess();
  });

  const validateCartItems = useCallback(async () => {
    if (!user) {
      setValidationError('You must be logged in to complete this purchase');
      return false;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // If we're using direct beat purchase with producer split
      if (producerId && beatId) {
        console.log('Validating direct beat purchase:', beatId);
        
        // Validate the beat exists and is available
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, status, producer_id, title')
          .eq('id', beatId)
          .maybeSingle();
        
        if (beatError) {
          console.error('Error validating beat:', beatError);
          setValidationError('Failed to validate the beat');
          return false;
        }
        
        if (!beatData || beatData.status !== 'published') {
          setValidationError('This beat is no longer available for purchase');
          return false;
        }
        
        if (beatData.producer_id !== producerId) {
          setValidationError('Producer mismatch. Please try again.');
          return false;
        }
        
        // Check if already purchased
        const { data: purchasedData, error: purchasedError } = await supabase
          .from('user_purchased_beats')
          .select('id')
          .eq('user_id', user.id)
          .eq('beat_id', beatId)
          .maybeSingle();
          
        if (purchasedError && purchasedError.code !== 'PGRST116') {
          console.error('Error checking purchased beat:', purchasedError);
        }
        
        if (purchasedData) {
          setValidationError(`You've already purchased this beat: ${beatData.title}`);
          return false;
        }
        
        // If split code is missing
        if (!splitCode) {
          console.warn('Split code missing for producer:', producerId);
          // We'll continue anyway, but the payment won't be split
        }
        
        return true;
      }
      
      // Normal cart validation
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

      if (!beatsData) {
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
  }, [user, cartItems, producerId, beatId, splitCode]);

  const handlePaymentStart = useCallback(async () => {
    if (isProcessing || isValidating) return;
    
    setIsProcessing(true);
    
    try {
      // First, ensure PaystackPop is available and properly loaded
      if (typeof window === 'undefined' || !window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
        console.error('PaystackPop not properly loaded. Make sure the script is loaded and initialized.');
        toast.error('Payment system not ready. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }
      
      // Then validate cart items
      const isValid = await validateCartItems();
      
      if (!isValid) {
        setIsProcessing(false);
        return;
      }
      
      // Generate a unique reference ID
      const reference = `ORDER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
      
      // Prepare order item data
      let orderItemsData;
      
      if (producerId && beatId) {
        // Direct beat purchase - fetch beat details
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, title, basic_license_price_local')
          .eq('id', beatId)
          .maybeSingle();
          
        if (beatError) {
          console.error('Error fetching beat details:', beatError);
          toast.error('Failed to fetch beat details. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        if (!beatData) {
          toast.error('Beat details not found. Please try again.');
          setIsProcessing(false);
          return;
        }
        
        orderItemsData = [{
          beat_id: beatData.id,
          title: beatData.title,
          price: beatData.basic_license_price_local,
          license: 'basic'
        }];
      } else {
        // Cart purchase
        orderItemsData = cartItems.map(item => ({
          beat_id: item.beat.id,
          title: item.beat.title,
          price: item.beat.basic_license_price_local,
          license: item.beat.selected_license || 'basic'
        }));
      }
      
      // Create order in database first
      const { orderId, error: orderError } = await createOrder(user, totalAmount, orderItemsData);
      
      if (orderError) {
        toast.error('Failed to create order: ' + orderError);
        setIsProcessing(false);
        return;
      }
      
      if (!orderId) {
        toast.error('Failed to create order: No order ID returned');
        setIsProcessing(false);
        return;
      }
      
      // Store order ID and cart info for verification
      localStorage.setItem('pendingOrderId', orderId);
      localStorage.setItem('orderItems', JSON.stringify(orderItemsData));
      localStorage.setItem('paystackReference', reference);
      localStorage.setItem('paystackAmount', totalAmount.toString());
      localStorage.setItem('paymentInProgress', 'true');
      localStorage.setItem('redirectToLibrary', 'true');
      localStorage.setItem('purchaseTime', Date.now().toString());
      
      // Add split_code to metadata if available
      const metadata = {
        custom_fields: [
          {
            display_name: "Order ID",
            variable_name: "order_id",
            value: orderId
          },
          {
            display_name: "Order Items",
            variable_name: "order_items",
            value: JSON.stringify(orderItemsData)
          }
        ]
      };
      
      // Payment log
      console.log('Starting Paystack payment with:', {
        reference,
        amount: totalAmount,
        email: user?.email,
        orderId,
        splitCode: splitCode || 'N/A',
        cartItems: orderItemsData
      });
      
      // Initialize and open Paystack with direct function references
      try {
        const closeFunc = paystackCloseRef.current;
        const successFunc = paystackSuccessRef.current;
        
        // Create the handler with explicit callback functions
        const handlerConfig: any = {
          key: 'pk_test_b3ff87016c279c34b015be72594fde728d5849b8', // Public test key
          email: user?.email || '',
          amount: totalAmount * 100, // Convert to kobo
          currency: 'NGN',
          ref: reference,
          label: 'OrderSOUNDS',
          metadata: metadata,
          onClose: function() {
            closeFunc();
          },
          callback: function(response: any) {
            successFunc(response);
          }
        };
        
        // Add split_code if available
        if (splitCode) {
          handlerConfig.split_code = splitCode;
        }
        
        const handler = window.PaystackPop.setup(handlerConfig);
        
        // Explicitly open the payment iframe
        handler.openIframe();
      } catch (error) {
        console.error('Paystack initialization error:', error);
        toast.error('Failed to initialize payment. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
    }
  }, [isProcessing, isValidating, totalAmount, user, validateCartItems, cartItems, clearCart, onSuccess, producerId, beatId, splitCode]);

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
