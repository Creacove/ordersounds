
import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useNavigate } from 'react-router-dom';
import { useBeats } from '@/hooks/useBeats';

interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
}

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

export function PaystackCheckout({ onSuccess, onClose, isOpen, totalAmount }: PaystackProps) {
  const { user } = useAuth();
  const { cartItems, clearCart, refreshCart } = useCart();
  const { fetchPurchasedBeats } = useBeats();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [reference] = useState(() => `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
  const navigate = useNavigate();
  
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
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('paystackReference');
        localStorage.removeItem('orderItems');
      }
    };
  }, [isProcessing]);

  useEffect(() => {
    if (isOpen) {
      setValidationError(null);
    }
  }, [isOpen]);

  const validateCartItems = async () => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      if (!user) {
        throw new Error('You must be logged in to complete this purchase.');
      }
      
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty. Add items before checkout.');
      }
      
      const beatIds = cartItems.map(item => item.beat.id);
      
      const { data: beatsExist, error: beatCheckError } = await supabase
        .from('beats')
        .select('id, producer_id')
        .in('id', beatIds);
      
      if (beatCheckError) {
        console.error('Error checking beats existence:', beatCheckError);
        throw new Error(`Failed to validate beats: ${beatCheckError.message}`);
      }
      
      if (!beatsExist || beatsExist.length !== beatIds.length) {
        const existingIds = beatsExist?.map(b => b.id) || [];
        const missingIds = beatIds.filter(id => !existingIds.includes(id));
        
        console.error('Some beats in cart no longer exist:', missingIds);
        throw new Error('Some items in your cart are no longer available. Please refresh your cart.');
      }
      
      return true;
    } catch (error) {
      console.error('Cart validation error:', error);
      setValidationError(error.message);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleRefreshCart = () => {
    refreshCart();
    setValidationError(null);
    toast.success("Cart refreshed");
  };

  const handlePaymentStart = async () => {
    if (isProcessing || isValidating) return;
    
    setIsProcessing(true);
    
    try {
      const isValid = await validateCartItems();
      if (!isValid) {
        throw new Error(validationError || 'Cart validation failed. Please try again.');
      }
      
      // Store order items data temporarily
      localStorage.setItem('orderItems', JSON.stringify(orderItemsData));
      
      // Create an order record first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_price: totalAmount,
          payment_method: 'Paystack',
          status: 'pending',
          currency_used: 'NGN'
        })
        .select('id')
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
      
      if (!orderData || !orderData.id) {
        throw new Error('Failed to create order: No order ID returned');
      }
      
      // Create line items for each beat in the cart
      const lineItems = cartItems.map(item => ({
        order_id: orderData.id,
        beat_id: item.beat.id,
        price_charged: item.beat.price_local,
        currency_code: 'NGN',
      }));
      
      const { error: lineItemError } = await supabase
        .from('line_items')
        .insert(lineItems);
      
      if (lineItemError) {
        console.error('Line items error:', lineItemError);
        throw new Error(`Line items creation failed: ${lineItemError.message}`);
      }
      
      // Save the order ID and payment reference for verification later
      setOrderId(orderData.id);
      localStorage.setItem('pendingOrderId', orderData.id);
      localStorage.setItem('paystackReference', reference);
      
      console.log('Starting Paystack payment for order:', orderData.id);
      
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
      console.log('Payment success, verifying with backend...', paymentReference, orderId);
      
      // Clear cart immediately to improve perceived performance
      clearCart();
      
      // Show loading toast to indicate verification is in progress
      toast.loading('Verifying your payment...', { id: 'payment-verification' });
      
      // Get the stored order items data
      const storedItems = localStorage.getItem('orderItems');
      const orderItems = storedItems ? JSON.parse(storedItems) : [];
      
      // Call the verification edge function with explicit order items data
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { 
          reference: paymentReference, 
          orderId,
          orderItems
        },
      });
      
      if (error) {
        console.error('Verification error:', error);
        toast.dismiss('payment-verification');
        toast.error(`Payment verification failed: ${error.message}`);
        onClose();
        return;
      }
      
      console.log('Verification response:', data);
      
      if (data.verified) {
        // Dismiss the loading toast
        toast.dismiss('payment-verification');
        toast.success('Payment successful! Your beats are now in your library.');
        
        // Close the dialog
        onClose();
        
        // Fetch newly purchased beats to update the library
        await fetchPurchasedBeats();
        
        // Navigate to library with state to show success notification
        setTimeout(() => {
          navigate('/library', { 
            state: { 
              fromPurchase: true,
              purchaseTime: new Date().toISOString() 
            },
            replace: true // Use replace to avoid issues with back navigation
          });
        }, 300);
      } else {
        toast.dismiss('payment-verification');
        toast.error('Payment verification failed. Please contact support with your reference: ' + paymentReference);
        onClose();
      }
      
    } catch (error) {
      console.error('Payment success handling error:', error);
      toast.dismiss('payment-verification');
      toast.error('There was an issue with your purchase. Please contact support with reference: ' + paymentReference);
      onClose();
    } finally {
      setIsProcessing(false);
      setOrderId(null);
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      localStorage.removeItem('orderItems');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You'll be redirected to Paystack to securely complete your payment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-muted/30 rounded-md mb-4">
          <p className="text-sm font-medium">Total Amount</p>
          <p className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">
            <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded-sm font-medium">Test Mode</span>
            {" "}- No real charges will be made
          </p>
        </div>
        
        {validationError && (
          <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md mb-4">
            <p className="text-sm font-medium text-destructive">{validationError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full"
              onClick={handleRefreshCart}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Cart
            </Button>
          </div>
        )}
        
        <div className="flex flex-col gap-3 mt-2">
          {/* Increased tap target size for mobile */}
          <Button 
            onClick={handlePaymentStart}
            disabled={isProcessing || isValidating}
            className="w-full py-6 text-base"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : isValidating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validating...
              </>
            ) : (
              'Pay with Paystack (Test Mode)'
            )}
          </Button>
          
          {/* Increased tap target size for Cancel button */}
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing || isValidating}
            className="w-full py-5 text-base"
            size="lg"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
