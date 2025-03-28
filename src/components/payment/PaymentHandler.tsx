
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
}

export function PaymentHandler({ totalAmount, onSuccess }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const { clearCart, cartItems } = useCart();
  const [hasItems, setHasItems] = useState(false);

  // Check if cart has items
  useEffect(() => {
    setHasItems(cartItems && cartItems.length > 0);
  }, [cartItems]);

  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    
    // Clear the cart after successful payment
    clearCart();
    
    // Set success flags in localStorage
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    // Show success toast
    toast.success('Payment successful! Redirecting to your library...');
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    // Close the payment dialog
    setIsPaystackOpen(false);
  };

  const handlePaystackClose = () => {
    setIsPaystackOpen(false);
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/30 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        <p>Please sign in to proceed with checkout</p>
      </div>
    );
  }

  // Disable payment button if cart is empty or total amount is 0
  const isDisabled = totalAmount <= 0 || !hasItems;

  return (
    <div className="space-y-4">
      {currency === 'NGN' ? (
        <>
          <Button 
            onClick={() => {
              // Log cart state before opening the payment dialog
              console.log('Cart items before payment:', cartItems);
              if (!cartItems || cartItems.length === 0) {
                toast.error('Your cart is empty. Please add items before checkout.');
                return;
              }
              setIsPaystackOpen(true);
            }}
            className="w-full py-6 text-base"
            size="lg"
            disabled={isDisabled}
          >
            Pay with Paystack (₦)
          </Button>
          
          <PaystackCheckout 
            isOpen={isPaystackOpen}
            onSuccess={handlePaystackSuccess}
            onClose={handlePaystackClose}
            totalAmount={totalAmount}
          />
        </>
      ) : (
        <Button 
          className="w-full py-6 text-base"
          size="lg"
          disabled={isDisabled}
          onClick={() => {
            // This will be replaced with Stripe implementation
            alert('Stripe payment integration for USD will be implemented separately');
          }}
        >
          Pay with Stripe ($)
        </Button>
      )}
    </div>
  );
}
