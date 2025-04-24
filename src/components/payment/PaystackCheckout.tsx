
import { usePaystackCheckout } from '@/hooks/payment/usePaystackCheckout';
import { PaystackDialog } from './PaystackDialog';

interface PaystackProps {
  onSuccess: (reference: string) => void;
  onClose: () => void;
  isOpen: boolean;
  totalAmount: number;
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
    beatId,
    testMode: true // Force test mode to ensure consistency
  });

  // Don't render anything if dialog is not open
  if (!isOpen) return null;

  return (
    <PaystackDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      isProcessing={isProcessing}
      isValidating={isValidating}
      validationError={validationError}
      amount={totalAmount}
    />
  );
}
