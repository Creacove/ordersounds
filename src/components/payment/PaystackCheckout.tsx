
import { usePaystackCheckout } from '@/hooks/payment/usePaystackCheckout';
import { PaystackDialog } from './PaystackDialog';

interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
  // New props for split payment
  splitCode?: string | null;
  producerId?: string;
  beatId?: string;
}

export function PaystackCheckout({ 
  onSuccess, 
  onClose, 
  isOpen, 
  totalAmount,
  splitCode,
  producerId,
  beatId
}: PaystackProps) {
  const {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart,
    forceCancel,
    paymentStarted
  } = usePaystackCheckout({
    onSuccess,
    onClose,
    totalAmount,
    splitCode,
    producerId,
    beatId
  });

  return (
    <PaystackDialog
      isOpen={isOpen}
      onClose={onClose}
      totalAmount={totalAmount}
      validationError={validationError}
      isProcessing={isProcessing}
      isValidating={isValidating}
      onPaymentStart={handlePaymentStart}
      onRefreshCart={handleRefreshCart}
      forceCancel={forceCancel}
      paymentStarted={paymentStarted}
    />
  );
}
