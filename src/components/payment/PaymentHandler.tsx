
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
}

export function PaymentHandler({ totalAmount, onSuccess }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const navigate = useNavigate();

  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    setIsPaystackOpen(false);
    if (onSuccess) onSuccess();
    else navigate('/buyer/orders');
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

  return (
    <div className="space-y-4">
      {currency === 'NGN' ? (
        <>
          <Button 
            onClick={() => setIsPaystackOpen(true)}
            className="w-full"
            size="lg"
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
          className="w-full"
          size="lg"
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
