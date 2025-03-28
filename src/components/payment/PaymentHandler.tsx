
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
}

export function PaymentHandler({ totalAmount, onSuccess }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const { clearCart, cartItems } = useCart();
  const [hasItems, setHasItems] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);

  // Load Paystack script
  useEffect(() => {
    // Check if script is already loaded and PaystackPop is available
    if (window.PaystackPop) {
      console.log('Paystack script is already loaded and PaystackPop is available');
      setScriptLoaded(true);
      return;
    }
    
    // If we're in the process of loading the script, don't try to load it again
    if (loadingScript) return;
    
    const loadScript = () => {
      setLoadingScript(true);
      
      // Remove any existing script to avoid conflicts
      const existingScript = document.getElementById('paystack-script');
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
  
      const script = document.createElement('script');
      script.src = "https://js.paystack.co/v1/inline.js";
      script.id = "paystack-script";
      script.async = true;
      
      script.onload = () => {
        // Give the script a moment to initialize
        setTimeout(() => {
          // Verify the script loaded correctly by checking for PaystackPop
          if (window.PaystackPop) {
            console.log('Paystack script loaded successfully');
            setScriptLoaded(true);
            setScriptError(false);
          } else {
            console.error('Paystack script loaded but PaystackPop is not available');
            setScriptError(true);
          }
          setLoadingScript(false);
        }, 500);
      };
      
      script.onerror = () => {
        console.error('Failed to load Paystack script');
        setScriptError(true);
        setLoadingScript(false);
        toast.error('Payment system failed to load. Please try again later.');
      };
      
      document.body.appendChild(script);
    };
    
    loadScript();
    
    return () => {
      // We no longer remove the script on unmount to prevent reloading issues
    };
  }, [loadingScript]);

  // Check if cart has items
  useEffect(() => {
    setHasItems(cartItems && cartItems.length > 0);
  }, [cartItems]);

  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    
    // Clear the cart after successful payment
    clearCart();
    
    // Set success flags in localStorage
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    // Show success toast
    toast.success('Payment successful! Redirecting to your library...');
    
    // Call onSuccess callback if provided
    if (onSuccess) {
      onSuccess();
    }
    
    // Close the payment dialog
    setIsPaystackOpen(false);
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

  // Disable payment button if cart is empty or total amount is 0 or script not loaded
  const isDisabled = totalAmount <= 0 || !hasItems || !scriptLoaded;

  return (
    <div className="space-y-4">
      {scriptError && (
        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md mb-4">
          <p className="text-sm font-medium text-destructive">
            There was an error loading the payment system. Please try refreshing the page.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full"
            onClick={() => window.location.reload()}
          >
            Refresh Page
          </Button>
        </div>
      )}
      
      {currency === 'NGN' ? (
        <>
          <Button 
            onClick={() => {
              if (!cartItems || cartItems.length === 0) {
                toast.error('Your cart is empty. Please add items before checkout.');
                return;
              }
              
              if (!scriptLoaded) {
                toast.error('Payment system is still loading. Please try again in a moment.');
                return;
              }
              
              if (!window.PaystackPop) {
                toast.error('Payment system not fully loaded. Please refresh the page and try again.');
                return;
              }
              
              setIsPaystackOpen(true);
            }}
            className="w-full py-6 text-base"
            size="lg"
            disabled={isDisabled}
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
          className="w-full py-6 text-base"
          size="lg"
          disabled={isDisabled}
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
