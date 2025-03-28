
import { usePaystackCheckout } from '@/hooks/payment/usePaystackCheckout';
import { PaystackDialog } from './PaystackDialog';

interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
}

export function PaystackCheckout({ onSuccess, onClose, isOpen, totalAmount }: PaystackProps) {
  const {
    isProcessing,
    isValidating,
    validationError,
    handlePaymentStart,
    handleRefreshCart
  } = usePaystackCheckout({
    onSuccess,
    onClose,
    totalAmount
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
    />
  );
}
