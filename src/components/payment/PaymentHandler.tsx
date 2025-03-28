
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
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
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const scriptLoadAttempts = useRef(0);
  const maxScriptLoadAttempts = 3;
  const paystackCheckTimer = useRef<NodeJS.Timeout | null>(null);

  // Function to verify Paystack is available and properly initialized
  const verifyPaystackAvailable = () => {
    try {
      return window.PaystackPop && 
             typeof window.PaystackPop === 'object' && 
             typeof window.PaystackPop.setup === 'function';
    } catch (e) {
      console.error('Error checking PaystackPop:', e);
      return false;
    }
  };

  // Function to load the Paystack script
  const loadPaystackScript = () => {
    if (scriptLoadAttempts.current >= maxScriptLoadAttempts) {
      console.error('Maximum script load attempts reached');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Unable to load payment system after multiple attempts. Please refresh the page or try again later.');
      return;
    }

    setLoadingScript(true);
    scriptLoadAttempts.current += 1;
    
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
      // Start a timer to check if PaystackPop is available
      if (paystackCheckTimer.current) {
        clearTimeout(paystackCheckTimer.current);
      }
      
      let checkCount = 0;
      const maxChecks = 5;
      
      const checkPaystackLoaded = () => {
        checkCount++;
        if (verifyPaystackAvailable()) {
          console.log('Paystack script loaded successfully');
          setScriptLoaded(true);
          setScriptError(false);
          setLoadingScript(false);
        } else if (checkCount < maxChecks) {
          // Continue checking every 500ms, up to maxChecks times
          console.log(`PaystackPop not available yet, checking again (${checkCount}/${maxChecks})`);
          paystackCheckTimer.current = setTimeout(checkPaystackLoaded, 500);
        } else {
          console.error('Paystack script loaded but PaystackPop is not available after multiple checks');
          setScriptError(true);
          setLoadingScript(false);
          
          // Try loading again after a short delay
          setTimeout(() => {
            loadPaystackScript();
          }, 2000);
        }
      };
      
      // Start checking for PaystackPop
      paystackCheckTimer.current = setTimeout(checkPaystackLoaded, 500);
    };
    
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Payment system failed to load. Please try again later.');
      
      // Try loading again after a short delay
      setTimeout(() => {
        loadPaystackScript();
      }, 2000);
    };
    
    document.body.appendChild(script);
  };

  // Load Paystack script
  useEffect(() => {
    // Initial verification for Paystack
    if (verifyPaystackAvailable()) {
      console.log('Paystack script is already loaded and PaystackPop is available');
      setScriptLoaded(true);
      return;
    }
    
    // If we're in the process of loading the script, don't try to load it again
    if (loadingScript) return;
    
    loadPaystackScript();
    
    return () => {
      // Cleanup timer
      if (paystackCheckTimer.current) {
        clearTimeout(paystackCheckTimer.current);
      }
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

  const handleReloadScript = () => {
    setScriptError(false);
    scriptLoadAttempts.current = 0;
    loadPaystackScript();
    toast.info('Reloading payment system...');
  };

  const handleStartPayment = () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (loadingScript) {
      toast.error('Payment system is still loading. Please wait a moment and try again.');
      return;
    }
    
    // Double-check Paystack availability before proceeding
    if (!verifyPaystackAvailable()) {
      toast.error('Payment system not properly initialized. Attempting to reload...');
      handleReloadScript();
      return;
    }
    
    setInitiatingPayment(true);
    
    // Give a small delay to ensure everything is ready
    setTimeout(() => {
      setIsPaystackOpen(true);
      setInitiatingPayment(false);
    }, 300);
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
  const isDisabled = totalAmount <= 0 || !hasItems || !scriptLoaded || loadingScript || initiatingPayment;

  return (
    <div className="space-y-4">
      {scriptError && (
        <div className="p-3 border border-destructive/50 bg-destructive/10 rounded-md mb-4">
          <p className="text-sm font-medium text-destructive">
            There was an error loading the payment system. Please try reloading.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-full flex items-center justify-center gap-2"
            onClick={handleReloadScript}
          >
            <RefreshCw size={14} />
            Reload Payment System
          </Button>
        </div>
      )}
      
      {loadingScript && !scriptError && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-md mb-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading payment system... Please wait.
          </p>
        </div>
      )}
      
      {currency === 'NGN' ? (
        <>
          <Button 
            onClick={handleStartPayment}
            className="w-full py-6 text-base"
            size="lg"
            disabled={isDisabled}
          >
            {initiatingPayment ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Initializing Payment...
              </>
            ) : loadingScript ? (
              'Loading Payment System...'
            ) : (
              'Pay with Paystack (₦)'
            )}
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
