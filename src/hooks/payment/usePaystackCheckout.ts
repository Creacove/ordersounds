
import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from 'sonner';
import { validateCartItems, createOrder, verifyPaystackPayment } from '@/utils/payment/paystackUtils';
import { useBeats } from '@/hooks/useBeats';

type Currency = 'NGN' | 'GHS' | 'USD' | 'ZAR';
type Channels = Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer' | 'eft'>;

interface PaystackConfig {
  reference: string;
  email: string;
  amount: number;
  publicKey: string;
  currency?: Currency;
  channels?: Channels;
  label?: string;
  onSuccess: (response: any) => void;
  onClose: () => void;
  metadata?: any;
}

interface UsePaystackCheckoutProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  totalAmount: number;
}

export const usePaystackCheckout = ({ onSuccess, onClose, totalAmount }: UsePaystackCheckoutProps) => {
  const { user } = useAuth();
  const { cartItems, clearCart, refreshCart } = useCart();
  const { fetchPurchasedBeats } = useBeats();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reference] = useState(() => `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  
  // Prepare order items data for temporary storage
  const orderItemsData = cartItems.map(item => ({
    beat_id: item.beat.id,
    title: item.beat.title,
    price: item.beat.price_local,
    license: item.beat.selected_license || 'basic'
  }));
  
  const paystackConfig: PaystackConfig = {
    reference,
    email: user?.email || '',
    amount: Math.round(totalAmount * 100),
    publicKey: 'pk_test_b3ff87016c279c34b015be72594fde728d5849b8',
    currency: 'NGN',
    channels: ['card'],
    label: 'Payment for beats',
    onSuccess: (response: any) => {
      console.log('Paystack success callback triggered with reference:', response.reference || reference);
      
      const storedOrderId = orderId || localStorage.getItem('pendingOrderId');
      if (storedOrderId) {
        handlePaymentSuccess(response.reference || reference, storedOrderId);
      } else {
        console.error('No pending order ID found');
        toast.error('Payment tracking error. Please contact support.');
      }
    },
    onClose: () => {
      setIsProcessing(false);
      setValidationError(null);
      toast.error("Payment canceled. You can try again when you're ready.");
      
      // Remove any payment-in-progress flags when user cancels
      localStorage.removeItem('paymentInProgress');
      localStorage.removeItem('redirectToLibrary');
      
      onClose();
    },
    metadata: {
      custom_fields: [
        {
          display_name: 'Order Items',
          variable_name: 'order_items',
          value: JSON.stringify(orderItemsData)
        }
      ]
    }
  };

  const initializePayment = usePaystackPayment(paystackConfig);

  useEffect(() => {
    return () => {
      if (!isProcessing) {
        // Only clear these if not in the middle of processing a payment
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('paystackReference');
        localStorage.removeItem('orderItems');
        localStorage.removeItem('paymentInProgress');
        localStorage.removeItem('redirectToLibrary');
      }
    };
  }, [isProcessing]);

  const handleRefreshCart = () => {
    refreshCart();
    setValidationError(null);
    toast.success("Cart refreshed");
  };

  const handlePaymentStart = async () => {
    if (isProcessing || isValidating) return;
    
    setIsProcessing(true);
    
    try {
      setIsValidating(true);
      const validation = await validateCartItems(user, cartItems);
      setIsValidating(false);
      
      if (validation.error) {
        setValidationError(validation.error);
        throw new Error(validation.error);
      }
      
      // Store order items data temporarily for processing after payment
      localStorage.setItem('orderItems', JSON.stringify(orderItemsData));
      
      // Create order and line items
      const orderResult = await createOrder(user, totalAmount, orderItemsData);
      
      if (orderResult.error) {
        throw new Error(orderResult.error);
      }
      
      // Save the order ID and payment reference for verification later
      setOrderId(orderResult.orderId);
      localStorage.setItem('pendingOrderId', orderResult.orderId);
      localStorage.setItem('paystackReference', reference);
      
      console.log('Starting Paystack payment for order:', orderResult.orderId);
      
      // Set payment-in-progress flag
      localStorage.setItem('paymentInProgress', 'true');
      
      // Use a slight delay before initializing payment to ensure UI updates
      setTimeout(() => {
        initializePayment();
      }, 100);
      
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsProcessing(false);
      toast.error(error.message || 'Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentReference: string, orderId: string) => {
    try {
      // Get the stored order items data
      const storedItems = localStorage.getItem('orderItems');
      const orderItems = storedItems ? JSON.parse(storedItems) : [];
      
      // Verify payment
      const verificationResult = await verifyPaystackPayment(paymentReference, orderId, orderItems);
      
      if (verificationResult.success) {
        // Close the payment dialog
        onClose();
        
        // Clear the cart after successful payment verification
        clearCart();
        
        // Set success flag to trigger UI update in Library component
        localStorage.setItem('purchaseSuccess', 'true');
        localStorage.setItem('purchaseTime', new Date().toISOString());
        
        // Call the onSuccess callback from parent component
        if (onSuccess) {
          onSuccess(paymentReference);
        }
        
        // Force a hard redirect to the library page
        window.location.href = '/library';
      } else {
        onClose();
      }
      
    } catch (error) {
      console.error('Payment success handling error:', error);
      toast.error('There was an issue with your purchase. Please contact support with reference: ' + paymentReference);
      onClose();
    } finally {
      setIsProcessing(false);
      setOrderId(null);
      
      // Clean up localStorage items
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      localStorage.removeItem('orderItems');
    }
  };

  return {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart,
    reference
  };
};
