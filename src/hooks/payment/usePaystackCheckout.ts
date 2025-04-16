import { useState, useCallback, useEffect, useRef } from 'react';
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
  const [paymentStarted, setPaymentStarted] = useState(false);
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const navigate = useNavigate();
  const paymentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const paystackHandlerRef = useRef<any>(null);
  
  // Create direct function references to prevent serialization issues
  const paystackCloseRef = useRef(() => {
    console.log('Payment window closed');
    setIsProcessing(false);
    setPaymentStarted(false);
    localStorage.removeItem('paymentInProgress');
    
    // Clear any existing payment timeout
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    onClose();
  });
  
  const paystackSuccessRef = useRef((response: any) => {
    console.log('Payment complete! Response:', response);
    
    // Clear any existing payment timeout
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    const handleSuccess = async () => {
      try {
        const orderId = localStorage.getItem('pendingOrderId');
        const orderItemsStr = localStorage.getItem('orderItems');
        
        if (!orderId || !orderItemsStr) {
          toast.error('Order information missing. Please try again.');
          setIsProcessing(false);
          setPaymentStarted(false);
          return;
        }
        
        const orderItemsData = JSON.parse(orderItemsStr);
        
        toast.loading('Verifying payment...', { id: 'payment-verification' });
        
        // Direct verification through the client
        try {
          // First check the current status of the order
          const { data: orderData, error: orderCheckError } = await supabase
            .from('orders')
            .select('status')
            .eq('id', orderId)
            .single();
            
          if (orderCheckError) {
            console.error('Error checking order status:', orderCheckError);
            toast.error('Error checking order status. Please try again.');
          } else if (orderData && orderData.status === 'completed') {
            // Order is already completed, treat as success
            console.log('Order already completed, proceeding as success');
            toast.success('Payment successful! Redirecting to your library...');
            
            clearCart();
            localStorage.setItem('purchaseSuccess', 'true');
            localStorage.setItem('purchaseTime', Date.now().toString());
            setIsProcessing(false);
            setPaymentStarted(false);
            onSuccess(response.reference);
            
            // Force direct to library
            setTimeout(() => {
              window.location.href = '/library';
            }, 1500);
            return;
          }
        } catch (orderCheckErr) {
          console.error('Exception checking order status:', orderCheckErr);
          // Continue with normal verification
        }
        
        // Verify the payment using the edge function
        try {
          // Here we call the edge function directly with the transaction reference
          const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
            body: { 
              reference: response.reference, 
              orderId,
              orderItems: orderItemsData
            },
          });
          
          toast.dismiss('payment-verification');
          
          if (error) {
            console.error('Edge function error:', error);
            toast.error(`Verification failed: ${error.message || 'Unknown error'}`);
            setIsProcessing(false);
            setPaymentStarted(false);
            return;
          }
          
          if (!data || !data.verified) {
            const errorMsg = data?.message || 'Payment verification failed';
            console.error('Verification failed:', errorMsg);
            toast.error(`Payment verification failed: ${errorMsg}`);
            setIsProcessing(false);
            setPaymentStarted(false);
            return;
          }
          
          // On success
          toast.success('Payment successful! Redirecting to your library...');
          clearCart();
          localStorage.setItem('purchaseSuccess', 'true');
          localStorage.setItem('purchaseTime', Date.now().toString());
          localStorage.removeItem('paymentInProgress');
          setIsProcessing(false);
          setPaymentStarted(false);
          onSuccess(response.reference);
          
          // Force navigate to library
          setTimeout(() => {
            window.location.href = '/library';
          }, 1500);
          
        } catch (verifyError) {
          console.error('Error during edge function call:', verifyError);
          toast.error('Payment verification failed. Please try again.');
          setIsProcessing(false);
          setPaymentStarted(false);
        }
      } catch (error) {
        console.error('Error during payment verification:', error);
        toast.error('An error occurred during payment processing');
        setIsProcessing(false);
        setPaymentStarted(false);
      }
    };
    
    handleSuccess();
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current) {
        clearTimeout(paymentTimeoutRef.current);
        paymentTimeoutRef.current = null;
      }
    };
  }, []);

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
    if (isProcessing || isValidating || paymentStarted) return;
    
    setIsProcessing(true);
    
    try {
      // Ensure PaystackPop is available
      if (typeof window === 'undefined' || !window.PaystackPop || typeof window.PaystackPop.setup !== 'function') {
        console.error('PaystackPop not properly loaded');
        toast.error('Payment system not ready. Please refresh the page and try again.');
        setIsProcessing(false);
        return;
      }
      
      // Validate cart items
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
        // Direct beat purchase
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
      
      // Create order in database
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
      localStorage.setItem('purchaseTime', Date.now().toString());
      
      // Add metadata
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
      
      // Mark payment as started
      setPaymentStarted(true);
      
      // Initialize and open Paystack with improved settings
      try {
        const closeFunc = paystackCloseRef.current;
        const successFunc = paystackSuccessRef.current;
        
        // Create handler with explicit callback functions and improved configuration
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
          },
          // These settings ensure the modal is not embedded in an iframe and can display properly
          embed: false,
          container: null,
          frame: true // Force using the popup window for better test button accessibility
        };
        
        // Add split_code if available
        if (splitCode) {
          handlerConfig.split_code = splitCode;
        }
        
        const handler = window.PaystackPop.setup(handlerConfig);
        paystackHandlerRef.current = handler;
        
        // Explicitly open the payment iframe
        handler.openIframe();
        
        // First quick timeout to check if popup opened
        if (paymentTimeoutRef.current) {
          clearTimeout(paymentTimeoutRef.current);
        }
        
        paymentTimeoutRef.current = setTimeout(() => {
          console.log('Initial check for payment window');
          // Just display a message that payment is in progress
          toast.info('Payment process started. The test payment screen should now be visible.');
          
          // Longer timeout for the overall process
          paymentTimeoutRef.current = setTimeout(() => {
            console.log('Final check for payment window (2 min timeout)');
            toast.error('Payment taking too long. Please try again.');
            setIsProcessing(false);
            setPaymentStarted(false);
            localStorage.removeItem('paymentInProgress');
          }, 120000); // 2 minute overall timeout
        }, 3000); // First check after 3 seconds
      } catch (error) {
        console.error('Paystack initialization error:', error);
        toast.error('Failed to initialize payment. Please try again.');
        setIsProcessing(false);
        setPaymentStarted(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to start payment process');
      setIsProcessing(false);
      setPaymentStarted(false);
    }
  }, [isProcessing, isValidating, paymentStarted, totalAmount, user, validateCartItems, cartItems, clearCart, onSuccess, producerId, beatId, splitCode]);

  const handleRefreshCart = async () => {
    setValidationError(null);
    await validateCartItems();
  };

  const forceCancel = () => {
    setIsProcessing(false);
    setPaymentStarted(false);
    setValidationError(null);
    localStorage.removeItem('paymentInProgress');
    localStorage.removeItem('pendingOrderId');
    localStorage.removeItem('paystackReference');
    localStorage.removeItem('orderItems');
    
    // Clear any existing payment timeout
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
      paymentTimeoutRef.current = null;
    }
    
    // If we have a handler reference, try to close it
    if (paystackHandlerRef.current && typeof paystackHandlerRef.current.close === 'function') {
      try {
        paystackHandlerRef.current.close();
      } catch (err) {
        console.error('Error closing Paystack iframe:', err);
      }
      paystackHandlerRef.current = null;
    }
    
    onClose();
    
    toast.info('Payment canceled');
  };

  return {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart,
    forceCancel,
    paymentStarted
  };
}
