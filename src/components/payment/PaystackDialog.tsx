
import { RefreshCw, Loader2, X, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
      <DialogContent className="sm:max-w-md p-4 max-h-[90vh] overflow-y-auto border-green-100 dark:border-green-900/40 shadow-lg backdrop-blur-sm">
        <DialogHeader className="mb-2">
          <DialogTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            {paymentStarted ? 
              "Payment window is opening. If you don't see it, please check if it's been blocked by your browser." :
              "You'll be redirected to Paystack's secure payment platform to complete this transaction."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-4 bg-green-50/60 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30 mb-4">
          <p className="text-sm font-medium text-green-800 dark:text-green-400">Total Amount</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">₦{totalAmount.toLocaleString()}</p>
          <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
            <span className="bg-green-100 text-green-800 dark:bg-green-800/60 dark:text-green-200 px-2 py-0.5 rounded-full text-xs font-medium">Test Mode</span>
          </p>
        </div>
        
        {validationError && (
          <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-lg mb-4">
            <p className="text-sm font-medium text-destructive">{validationError}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 w-full border-destructive/30 hover:border-destructive/50 transition-colors"
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
        
        {paymentStarted && (
          <Alert className="mb-4 bg-blue-50/60 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40">
            <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
              In test mode, use any of these cards: <code className="bg-blue-100/50 dark:bg-blue-800/50 px-1 py-0.5 rounded">408 4084 0840 8408</code> with any future date and CVV. Use <code className="bg-blue-100/50 dark:bg-blue-800/50 px-1 py-0.5 rounded">123456</code> for OTP when prompted.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col gap-3 mt-2">
          <Button 
            onClick={onPaymentStart}
            disabled={isProcessing || isValidating || validationError !== null || paymentStarted}
            className="w-full py-6 text-base bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white border-none transition-all hover:shadow-md disabled:opacity-70"
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
                Opening payment window...
              </>
            ) : isValidating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Validating...
              </>
            ) : (
              'Proceed to Payment'
            )}
          </Button>
          
          {(isProcessing || paymentStarted) && forceCancel && (
            <Button 
              variant="destructive" 
              onClick={forceCancel}
              className="w-full py-2 text-sm hover:bg-destructive/90 transition-colors"
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
            className="w-full py-5 text-base border-gray-300 dark:border-gray-700 transition-all hover:bg-background/80"
            size="lg"
          >
            Back
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
