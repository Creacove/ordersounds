
import { RefreshCw, Loader2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PaystackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  validationError: string | null;
  isProcessing: boolean;
  isValidating: boolean;
  onPaymentStart: () => void;
  onRefreshCart: () => void;
  forceCancel?: () => void;
  paymentStarted?: boolean;
}

export function PaystackDialog({
  isOpen,
  onClose,
  totalAmount,
  validationError,
  isProcessing,
  isValidating,
  onPaymentStart,
  onRefreshCart,
  forceCancel,
  paymentStarted
}: PaystackDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            {paymentStarted ? 
              "Paystack payment window should be open. If not visible, please wait or use the Cancel button below." :
              "You'll be redirected to Paystack to securely complete your payment."}
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
              onClick={onRefreshCart}
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> 
                  Refresh Cart
                </>
              )}
            </Button>
          </div>
        )}
        
        {paymentStarted ? (
          <div className="p-3 border border-orange-500/30 bg-orange-500/10 rounded-md mb-4">
            <p className="text-sm">
              <span className="font-medium">Test Payment Instructions:</span> In test mode, you can use the Success, Bank Authentication, or Declined buttons to simulate different payment outcomes.
            </p>
            <p className="text-xs mt-1 text-muted-foreground">
              If the test buttons aren't clickable yet, please wait a few seconds for the payment screen to fully load.
            </p>
          </div>
        ) : null}
        
        <div className="flex flex-col gap-3 mt-2">
          <Button 
            onClick={onPaymentStart}
            disabled={isProcessing || isValidating || validationError !== null || paymentStarted}
            className="w-full py-6 text-base"
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : paymentStarted ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Payment window opened...
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
          
          {(isProcessing || paymentStarted) && forceCancel && (
            <Button 
              variant="destructive" 
              onClick={forceCancel}
              className="w-full py-2 text-sm"
              size="sm"
            >
              <X size={16} className="mr-2" />
              Cancel Payment
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing && !forceCancel}
            className="w-full py-5 text-base"
            size="lg"
          >
            Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
