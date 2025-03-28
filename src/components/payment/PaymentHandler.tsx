
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
}

export function PaymentHandler({ totalAmount, onSuccess }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const { clearCart } = useCart();

  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    
    // Clear the cart after successful payment
    clearCart();
    
    // Show success message via toast is handled in PaystackCheckout
    setIsPaystackOpen(false);
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
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
  const isDisabled = totalAmount <= 0;

  return (
    <div className="space-y-4">
      {currency === 'NGN' ? (
        <>
          {/* Increased tap target size for pay button */}
          <Button 
            onClick={() => setIsPaystackOpen(true)}
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
