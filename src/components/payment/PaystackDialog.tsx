
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
      <DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto border-green-100 dark:border-green-900/40 shadow-lg backdrop-blur-sm">
        <DialogHeader className="px-6 pt-6 pb-4 bg-gradient-to-r from-green-50/80 to-emerald-50/80 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100/80 dark:border-green-900/40">
          <DialogTitle className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-500 dark:from-green-400 dark:to-emerald-300">Complete Your Purchase</DialogTitle>
          <DialogDescription>
            {paymentStarted ? 
              "Payment window is opening. If you don't see it, please check if it's been blocked by your browser." :
              "You'll be redirected to Paystack's secure payment platform to complete this transaction."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 space-y-5">
          <div className="p-4 bg-green-50/80 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800/30 shadow-sm">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">Total Amount</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">₦{totalAmount.toLocaleString()}</p>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-1">
              <span className="bg-green-100 text-green-800 dark:bg-green-800/60 dark:text-green-200 px-2 py-0.5 rounded-full text-xs font-medium">Test Mode</span>
            </p>
          </div>
          
          {validationError && (
            <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-lg">
              <p className="text-sm font-medium text-destructive">{validationError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 w-full border-destructive/30 hover:border-destructive/50 hover:bg-destructive/10 transition-colors"
                onClick={onRefreshCart}
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <span className="h-4 w-4 mr-2 inline-block">
                      <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full block" />
                    </span>
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
            <Alert className="bg-blue-50/80 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 shadow-sm">
              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400" />
              <AlertDescription className="text-xs text-blue-700 dark:text-blue-300">
                In test mode, use any of these cards: <code className="bg-blue-100/70 dark:bg-blue-800/70 px-1.5 py-0.5 rounded">408 4084 0840 8408</code> with any future date and CVV. Use <code className="bg-blue-100/70 dark:bg-blue-800/70 px-1.5 py-0.5 rounded">123456</code> for OTP when prompted.
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col gap-3 pt-2">
            <Button 
              onClick={onPaymentStart}
              disabled={isProcessing || isValidating || validationError !== null || paymentStarted}
              className="w-full py-6 text-base shadow-md hover:shadow-lg transition-all"
              variant="success"
              rounded="lg"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <span className="h-5 w-5 mr-2 inline-block">
                    <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full block" />
                  </span>
                  Processing...
                </>
              ) : paymentStarted ? (
                <>
                  <span className="h-5 w-5 mr-2 inline-block">
                    <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full block" />
                  </span>
                  Opening payment window...
                </>
              ) : isValidating ? (
                <>
                  <span className="h-5 w-5 mr-2 inline-block">
                    <span className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full block" />
                  </span>
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
                rounded="lg"
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
              className="w-full py-5 text-base border-gray-300 dark:border-gray-700 hover:bg-secondary/20 transition-all shadow-sm hover:shadow"
              rounded="lg"
              size="lg"
            >
              Back
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
