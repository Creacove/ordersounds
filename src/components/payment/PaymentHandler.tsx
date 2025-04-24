
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { usePaystackCheckout } from '@/hooks/payment/usePaystackCheckout';
import { PaystackDialog } from './PaystackDialog';
import { useCart } from '@/context/CartContext';
import { WalletConnectButton } from '@/components/wallets/WalletConnectButton';
import { useWallet } from '@solana/wallet-adapter-react';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: (reference: string) => void;
  splitCode?: string;
  producerId?: string;
  beatId?: string;
}

export function PaymentHandler({ totalAmount, onSuccess, splitCode, producerId, beatId }: PaymentHandlerProps) {
  const { user, currency } = useAuth();
  const { openSolanaCheckout } = useCart();
  const [isPaystackDialogOpen, setIsPaystackDialogOpen] = useState(false);
  const { isWalletConnected } = useWallet();

  // Initialize Paystack checkout
  const {
    handlePaymentStart: handlePaystackStart,
    isProcessing: isPaystackProcessing,
    validationError: paystackValidationError,
    isValidating: isPaystackValidating,
    paymentStarted: paystackStarted,
    forceCancel: cancelPaystack,
  } = usePaystackCheckout({
    onSuccess: (reference) => {
      if (onSuccess) onSuccess(reference);
      setIsPaystackDialogOpen(false);
    },
    onClose: () => {
      setIsPaystackDialogOpen(false);
    },
    totalAmount,
    splitCode,
    producerId,
    beatId,
    testMode: true // Remove in production
  });

  const handlePaystackCheckout = () => {
    setIsPaystackDialogOpen(true);
    handlePaystackStart();
  };

  const handleSolanaCheckout = () => {
    openSolanaCheckout();
  };
  
  if (!user) {
    return (
      <Button className="w-full button-gradient">
        Login to continue
      </Button>
    );
  }

  return (
    <div className="space-y-3 w-full">
      {currency === 'NGN' ? (
        <Button 
          className="w-full button-gradient" 
          onClick={handlePaystackCheckout}
          disabled={totalAmount <= 0}
        >
          Pay with Paystack (₦{totalAmount.toLocaleString()})
        </Button>
      ) : (
        <>
          <div className="grid gap-3">
            <Button 
              className="w-full button-gradient" 
              onClick={handleSolanaCheckout}
              disabled={totalAmount <= 0}
            >
              Pay with Solana (${totalAmount.toLocaleString()})
            </Button>
            
            {!isWalletConnected && (
              <div className="flex justify-center">
                <WalletConnectButton />
              </div>
            )}
          </div>
        </>
      )}

      {/* Paystack Dialog */}
      <PaystackDialog
        open={isPaystackDialogOpen}
        onOpenChange={(open) => {
          setIsPaystackDialogOpen(open);
          if (!open && paystackStarted) {
            cancelPaystack();
          }
        }}
        isProcessing={isPaystackProcessing}
        isValidating={isPaystackValidating}
        validationError={paystackValidationError}
        amount={totalAmount}
      />
    </div>
  );
}
