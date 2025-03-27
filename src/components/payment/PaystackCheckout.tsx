
import { useState } from 'react';
import { usePaystackPayment } from 'react-paystack';
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// TypeScript interfaces for our component
interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
}

// Main PaystackCheckout component
export function PaystackCheckout({ onSuccess, onClose, isOpen, totalAmount }: PaystackProps) {
  const { user } = useAuth();
  const { cartItems, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [reference] = useState(() => `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

  // Configure Paystack parameters
  const config = {
    reference,
    email: user?.email || '',
    amount: totalAmount * 100, // Paystack requires amount in kobo (smallest unit)
    publicKey: 'pk_live_699eb330ab23079fd06b6567349abd7af5a758ba',
    metadata: {
      custom_fields: [
        {
          display_name: 'Order Items',
          variable_name: 'order_items',
          value: JSON.stringify(cartItems.map(item => ({
            beat_id: item.beat.id,
            title: item.beat.title,
            price: item.beat.price_local,
            license: item.beat.selected_license || 'basic'
          })))
        }
      ]
    },
  };

  const initializePayment = usePaystackPayment(config);

  const handlePaymentStart = async () => {
    if (!user) {
      toast.error('You must be logged in to complete this purchase.');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Create a pending order in the database first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          buyer_id: user.id,
          total_price: totalAmount,
          payment_method: 'paystack',
          status: 'pending',
          currency_used: 'NGN',
        })
        .select('id')
        .single();
      
      if (orderError) {
        throw new Error(`Order creation failed: ${orderError.message}`);
      }
      
      // Add line items for this order
      const orderItems = cartItems.map(item => ({
        order_id: orderData.id,
        beat_id: item.beat.id,
        price_charged: item.beat.price_local,
        currency_code: 'NGN',
      }));
      
      const { error: lineItemError } = await supabase
        .from('line_items')
        .insert(orderItems);
      
      if (lineItemError) {
        throw new Error(`Line items creation failed: ${lineItemError.message}`);
      }
      
      // Initialize Paystack payment
      // Store the order ID in localStorage so we can access it after redirect
      localStorage.setItem('pendingOrderId', orderData.id);
      localStorage.setItem('paystackReference', reference);
      
      // Function to call the Paystack popup
      initializePayment({
        onSuccess: () => {
          // This runs after a successful payment
          handlePaymentSuccess(reference, orderData.id);
        },
        onClose: () => {
          setIsProcessing(false);
          toast.error("Payment canceled. You can try again when you're ready.");
          onClose();
        },
      });
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsProcessing(false);
      toast.error('Failed to initialize payment. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentReference: string, orderId: string) => {
    try {
      // Verify the payment was successful through our edge function
      const { data, error } = await supabase.functions.invoke('verify-paystack-payment', {
        body: { reference: paymentReference, orderId },
      });
      
      if (error) {
        throw new Error(`Payment verification failed: ${error.message}`);
      }
      
      if (data.verified) {
        // Update order status in database
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'completed',
            consent_timestamp: new Date().toISOString(),
          })
          .eq('id', orderId);
        
        if (updateError) {
          throw new Error(`Order update failed: ${updateError.message}`);
        }
        
        // Add purchased beats to user's collection
        const purchasedItems = cartItems.map(item => ({
          user_id: user!.id,
          beat_id: item.beat.id,
          license_type: item.beat.selected_license || 'basic',
          currency_code: 'NGN',
          order_id: orderId,
        }));
        
        const { error: purchaseError } = await supabase
          .from('user_purchased_beats')
          .insert(purchasedItems);
        
        if (purchaseError) {
          throw new Error(`Recording purchases failed: ${purchaseError.message}`);
        }
        
        // Clear the cart after successful purchase
        clearCart();
        toast.success('Payment successful! Your beats are now in your library.');
        onSuccess(paymentReference);
      } else {
        toast.error('Payment verification failed. Please contact support with your reference: ' + paymentReference);
      }
    } catch (error) {
      console.error('Payment success handling error:', error);
      toast.error('There was an issue with your purchase. Please contact support with reference: ' + paymentReference);
    } finally {
      setIsProcessing(false);
      // Clear stored order ID and reference
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Purchase</DialogTitle>
          <DialogDescription>
            You'll be redirected to Paystack to securely complete your payment.
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-muted/30 rounded-md mb-4">
          <p className="text-sm font-medium">Total Amount</p>
          <p className="text-2xl font-bold">₦{totalAmount.toLocaleString()}</p>
        </div>
        
        <div className="flex flex-col gap-4">
          <Button 
            onClick={handlePaymentStart}
            disabled={isProcessing}
            className="w-full"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Pay with Paystack'
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
