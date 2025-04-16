
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { getProducerSplitCode } from '@/utils/payment/paystackSplitUtils';

interface PaymentHandlerProps {
  totalAmount: number;
  onSuccess?: () => void;
  producerId?: string;
  beatId?: string;
}

export function PaymentHandler({ totalAmount, onSuccess, producerId, beatId }: PaymentHandlerProps) {
  const [isPaystackOpen, setIsPaystackOpen] = useState(false);
  const { currency, user } = useAuth();
  const { clearCart, cartItems } = useCart();
  const [hasItems, setHasItems] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [splitCode, setSplitCode] = useState<string | null>(null);
  const [loadingSplitCode, setLoadingSplitCode] = useState(false);
  const scriptLoadAttempts = useRef(0);
  const maxScriptLoadAttempts = 3;
  const scriptCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const paystackScriptUrl = "https://js.paystack.co/v1/inline.js";

  // Pre-load Paystack script as soon as possible
  useEffect(() => {
    const preloadLink = document.createElement('link');
    preloadLink.rel = 'preload';
    preloadLink.as = 'script';
    preloadLink.href = paystackScriptUrl;
    document.head.appendChild(preloadLink);
    
    return () => {
      if (preloadLink.parentNode) {
        document.head.removeChild(preloadLink);
      }
    };
  }, []);

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
    
    // Clear any existing script checks
    if (scriptCheckInterval.current) {
      clearInterval(scriptCheckInterval.current);
      scriptCheckInterval.current = null;
    }
    
    // Remove any existing script element
    const existingScript = document.getElementById('paystack-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Create a new script element
    const script = document.createElement('script');
    script.src = paystackScriptUrl;
    script.id = "paystack-script";
    script.async = true;
    
    script.onload = () => {
      // Check for Paystack object using interval for reliability
      let checkCount = 0;
      const maxChecks = 10;
      
      scriptCheckInterval.current = setInterval(() => {
        checkCount++;
        if (verifyPaystackAvailable()) {
          if (scriptCheckInterval.current) {
            clearInterval(scriptCheckInterval.current);
            scriptCheckInterval.current = null;
          }
          console.log('Paystack script loaded successfully');
          setScriptLoaded(true);
          setScriptError(false);
          setLoadingScript(false);
        } else if (checkCount >= maxChecks) {
          if (scriptCheckInterval.current) {
            clearInterval(scriptCheckInterval.current);
            scriptCheckInterval.current = null;
          }
          console.error('Paystack script loaded but PaystackPop is not available after multiple checks');
          setScriptError(true);
          setLoadingScript(false);
          
          // Try again after a delay
          setTimeout(() => {
            loadPaystackScript();
          }, 1500);
        } else {
          console.log(`PaystackPop not available yet, checking again (${checkCount}/${maxChecks})`);
        }
      }, 300); // Check faster with shorter intervals
    };
    
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Payment system failed to load. Please try again.');
      
      // Try again after a delay
      setTimeout(() => {
        loadPaystackScript();
      }, 1500);
    };
    
    document.body.appendChild(script);
  };

  useEffect(() => {
    if (verifyPaystackAvailable()) {
      console.log('Paystack script is already loaded and PaystackPop is available');
      setScriptLoaded(true);
      return;
    }
    
    if (loadingScript) return;
    
    loadPaystackScript();
    
    return () => {
      if (scriptCheckInterval.current) {
        clearInterval(scriptCheckInterval.current);
        scriptCheckInterval.current = null;
      }
    };
  }, [loadingScript]);

  useEffect(() => {
    setHasItems(cartItems && cartItems.length > 0);
  }, [cartItems]);
  
  useEffect(() => {
    const fetchSplitCode = async () => {
      if (!producerId) return;
      
      try {
        setLoadingSplitCode(true);
        const code = await getProducerSplitCode(producerId);
        console.log(`Split code for producer ${producerId}:`, code);
        setSplitCode(code);
      } catch (error) {
        console.error('Error fetching split code:', error);
      } finally {
        setLoadingSplitCode(false);
      }
    };
    
    fetchSplitCode();
  }, [producerId]);

  const handlePaystackSuccess = (reference: string) => {
    console.log('Payment successful with reference:', reference);
    
    clearCart();
    
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    toast.success('Payment successful! Redirecting to your library...');
    
    if (onSuccess) {
      onSuccess();
    }
    
    setIsPaystackOpen(false);
  };

  const handlePaystackClose = () => {
    setInitiatingPayment(false);
    setIsPaystackOpen(false);
  };

  const handleReloadScript = () => {
    setScriptError(false);
    scriptLoadAttempts.current = 0;
    loadPaystackScript();
    toast.info('Reloading payment system...');
  };

  const handleStartPayment = () => {
    if (!producerId && (!cartItems || cartItems.length === 0)) {
      toast.error('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    if (loadingScript) {
      toast.error('Payment system is still loading. Please wait a moment and try again.');
      return;
    }
    
    if (!verifyPaystackAvailable()) {
      toast.error('Payment system not properly initialized. Attempting to reload...');
      handleReloadScript();
      return;
    }
    
    setInitiatingPayment(true);
    
    // Small delay to show feedback before opening dialog
    setTimeout(() => {
      setIsPaystackOpen(true);
      // Don't reset initiatingPayment here to prevent double-clicks
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

  const isDisabled = totalAmount <= 0 || (!hasItems && !producerId) || !scriptLoaded || loadingScript || initiatingPayment || loadingSplitCode;

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
      
      {loadingSplitCode && producerId && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-md mb-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Preparing payment details... Please wait.
          </p>
        </div>
      )}
      
      {currency === 'NGN' && (
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
            ) : loadingSplitCode ? (
              'Preparing Payment...'
            ) : (
              'Pay with Paystack (₦)'
            )}
          </Button>
          
          <PaystackCheckout 
            isOpen={isPaystackOpen}
            onSuccess={handlePaystackSuccess}
            onClose={handlePaystackClose}
            totalAmount={totalAmount}
            splitCode={splitCode}
            beatId={beatId}
            producerId={producerId}
          />
        </>
      )}
    </div>
  );
}
