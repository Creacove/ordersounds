
import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { PaystackCheckout } from './PaystackCheckout';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, RefreshCw, Loader2, CreditCard } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { toast } from 'sonner';
import { getProducerSplitCode } from '@/utils/payment/paystackSplitUtils';
import { createStripeCheckoutSession } from '@/utils/payment/paystackUtils';

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
  const paystackCheckTimer = useRef<NodeJS.Timeout | null>(null);
  const [stripeProcessing, setStripeProcessing] = useState(false);

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
    // Only load Paystack if using NGN currency
    if (currency !== 'NGN') {
      setScriptLoaded(true);
      return;
    }
    
    if (scriptLoadAttempts.current >= maxScriptLoadAttempts) {
      console.error('Maximum script load attempts reached');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Unable to load payment system after multiple attempts. Please refresh the page or try again later.');
      return;
    }

    setLoadingScript(true);
    scriptLoadAttempts.current += 1;
    
    const existingScript = document.getElementById('paystack-script');
    if (existingScript) {
      document.body.removeChild(existingScript);
    }

    const script = document.createElement('script');
    script.src = "https://js.paystack.co/v1/inline.js";
    script.id = "paystack-script";
    script.async = true;
    
    script.onload = () => {
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
          console.log(`PaystackPop not available yet, checking again (${checkCount}/${maxChecks})`);
          paystackCheckTimer.current = setTimeout(checkPaystackLoaded, 500);
        } else {
          console.error('Paystack script loaded but PaystackPop is not available after multiple checks');
          setScriptError(true);
          setLoadingScript(false);
          
          setTimeout(() => {
            loadPaystackScript();
          }, 2000);
        }
      };
      
      paystackCheckTimer.current = setTimeout(checkPaystackLoaded, 500);
    };
    
    script.onerror = () => {
      console.error('Failed to load Paystack script');
      setScriptError(true);
      setLoadingScript(false);
      toast.error('Payment system failed to load. Please try again later.');
      
      setTimeout(() => {
        loadPaystackScript();
      }, 2000);
    };
    
    document.body.appendChild(script);
  };

  useEffect(() => {
    // For NGN, check if Paystack is loaded
    if (currency === 'NGN') {
      if (verifyPaystackAvailable()) {
        console.log('Paystack script is already loaded and PaystackPop is available');
        setScriptLoaded(true);
        return;
      }
      
      if (loadingScript) return;
      
      loadPaystackScript();
      
      return () => {
        if (paystackCheckTimer.current) {
          clearTimeout(paystackCheckTimer.current);
        }
      };
    } else {
      // For USD, we're using Stripe - no script needs to be loaded
      setScriptLoaded(true);
    }
  }, [loadingScript, currency]);

  useEffect(() => {
    setHasItems(cartItems && cartItems.length > 0);
  }, [cartItems]);
  
  useEffect(() => {
    const fetchSplitCode = async () => {
      if (!producerId || currency !== 'NGN') return;
      
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
  }, [producerId, currency]);

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
    setIsPaystackOpen(false);
  };

  const handleReloadScript = () => {
    setScriptError(false);
    scriptLoadAttempts.current = 0;
    loadPaystackScript();
    toast.info('Reloading payment system...');
  };

  const handleStartPaystackPayment = () => {
    if (currency !== 'NGN') return;
    
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
    
    setTimeout(() => {
      setIsPaystackOpen(true);
      setInitiatingPayment(false);
    }, 300);
  };
  
  const handleStartStripePayment = async () => {
    if (currency !== 'USD') return;
    
    if (!producerId && (!cartItems || cartItems.length === 0)) {
      toast.error('Your cart is empty. Please add items before checkout.');
      return;
    }
    
    setStripeProcessing(true);
    
    try {
      // Prepare order items data
      let orderItemsData;
      
      if (producerId && beatId) {
        // Direct beat purchase - fetch beat details
        const { data: beatData, error: beatError } = await supabase
          .from('beats')
          .select('id, title, basic_license_price_diaspora')
          .eq('id', beatId)
          .single();
          
        if (beatError) {
          console.error('Error fetching beat details:', beatError);
          toast.error('Failed to fetch beat details. Please try again.');
          setStripeProcessing(false);
          return;
        }
        
        orderItemsData = [{
          beat_id: beatData.id,
          title: beatData.title,
          price: beatData.basic_license_price_diaspora,
          license: 'basic'
        }];
      } else {
        // Cart purchase
        orderItemsData = cartItems.map(item => ({
          beat_id: item.beat.id,
          title: item.beat.title,
          price: item.beat.basic_license_price_diaspora,
          license: item.beat.selected_license || 'basic'
        }));
      }
      
      const stripeResult = await createStripeCheckoutSession(
        user, 
        totalAmount,
        orderItemsData
      );
      
      if (!stripeResult.success) {
        toast.error(`Payment failed: ${stripeResult.error}`);
        setStripeProcessing(false);
        return;
      }
      
      // Redirect to Stripe Checkout
      window.location.href = stripeResult.sessionUrl;
      
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Payment initialization failed. Please try again later.');
      setStripeProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/30 text-muted-foreground">
        <AlertCircle className="h-5 w-5" />
        <p>Please sign in to proceed with checkout</p>
      </div>
    );
  }

  const isDisabled = totalAmount <= 0 || (!hasItems && !producerId) || 
                    (currency === 'NGN' && (!scriptLoaded || loadingScript || initiatingPayment || loadingSplitCode)) ||
                    (currency === 'USD' && stripeProcessing);

  return (
    <div className="space-y-4">
      {scriptError && currency === 'NGN' && (
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
      
      {loadingScript && !scriptError && currency === 'NGN' && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-md mb-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading payment system... Please wait.
          </p>
        </div>
      )}
      
      {loadingSplitCode && producerId && currency === 'NGN' && (
        <div className="p-3 border border-primary/20 bg-primary/5 rounded-md mb-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Preparing payment details... Please wait.
          </p>
        </div>
      )}
      
      {currency === 'NGN' ? (
        <>
          <Button 
            onClick={handleStartPaystackPayment}
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
      ) : (
        <Button 
          className="w-full py-6 text-base"
          size="lg"
          disabled={isDisabled}
          onClick={handleStartStripePayment}
        >
          {stripeProcessing ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Initializing Payment...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay with Stripe ($)
            </>
          )}
        </Button>
      )}
    </div>
  );
}
