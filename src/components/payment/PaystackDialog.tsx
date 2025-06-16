
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
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
          <DialogTitle className="text-xl font-semibold text-green-700 dark:text-green-300">
            Complete Your Purchase
          </DialogTitle>
          <DialogDescription>
            {paymentStarted 
              ? "Payment window is opening. If you don't see it, please check if it's been blocked by your browser."
              : "You'll be redirected to Paystack's secure payment platform to complete this transaction."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Total Amount</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">₦{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              <span className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full text-xs font-medium">
                Test Mode
              </span>
            </p>
          </div>
          
          {validationError && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-3">{validationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
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
            <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <Info className="h-4 w-4 text-blue-500" />
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                In test mode, use card: <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">408 4084 0840 8408</code> with any future date and CVV. 
                Use <code className="bg-blue-100 dark:bg-blue-800 px-1 py-0.5 rounded">123456</code> for OTP.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-3">
            <Button 
              onClick={onPaymentStart}
              disabled={isProcessing || isValidating || validationError !== null || paymentStarted}
              className="w-full py-6 text-base"
              variant="default"
              size="lg"
            >
              {isProcessing || paymentStarted ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {paymentStarted ? 'Opening payment window...' : 'Processing...'}
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
                className="w-full"
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
              className="w-full"
            >
              Back
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
