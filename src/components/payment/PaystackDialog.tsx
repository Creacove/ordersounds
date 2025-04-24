
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

export interface PaystackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isProcessing: boolean;
  isValidating: boolean;
  validationError: string | null;
  amount: number;
}

export function PaystackDialog({
  open,
  onOpenChange,
  isProcessing,
  isValidating,
  validationError,
  amount
}: PaystackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Payment Processing</DialogTitle>
        </DialogHeader>
        <div className="py-6">
          {isValidating && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-center text-sm">Validating your order...</p>
            </div>
          )}

          {validationError && (
            <div className="p-4 rounded-md bg-red-50 border border-red-200">
              <p className="text-red-700">{validationError}</p>
            </div>
          )}

          {isProcessing && !validationError && (
            <div className="flex flex-col items-center justify-center space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-center text-sm">Processing payment of ₦{amount.toLocaleString()}...</p>
              <p className="text-center text-xs text-muted-foreground">
                You will be redirected to the payment gateway.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
