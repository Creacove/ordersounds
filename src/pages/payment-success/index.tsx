
import { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, Music, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ScrollToTop } from '@/components/utils/ScrollToTop';

export default function PaymentSuccess() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    document.title = "Payment Successful | OrderSOUNDS";
    
    const clearCart = () => {
      // Clear cart data from localStorage
      localStorage.removeItem('cart');
      
      // Set purchase success flags
      localStorage.setItem('purchaseSuccess', 'true');
      localStorage.setItem('purchaseTime', Date.now().toString());
    };

    const verifyPayment = async () => {
      setLoading(true);
      
      try {
        // Check if we redirected from Paystack
        const purchaseSuccess = localStorage.getItem('purchaseSuccess');
        if (purchaseSuccess === 'true') {
          // Already verified by Paystack flow
          setLoading(false);
          return;
        }
        
        // For Stripe, verify the session if we have a session ID
        if (sessionId) {
          // Call the verify-stripe-session function 
          const { data, error } = await supabase.functions.invoke('verify-stripe-session', {
            body: { sessionId }
          });
          
          if (error) {
            console.error('Payment verification error:', error);
            setError('Could not verify payment. Please contact support.');
            setLoading(false);
            return;
          }
          
          if (data?.verified) {
            clearCart();
            setLoading(false);
          } else {
            setError('Payment verification failed. Please contact support.');
            setLoading(false);
          }
        } else {
          // No session ID, but we're on success page
          // This could be from webhook completing before redirect
          clearCart();
          setLoading(false);
        }
      } catch (err) {
        console.error('Error during payment verification:', err);
        setError('An error occurred during payment verification');
        setLoading(false);
      }
    };

    verifyPayment();
    
    // Clean up localStorage 
    return () => {
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      localStorage.removeItem('paymentInProgress');
      localStorage.removeItem('orderItems');
    };
  }, [sessionId]);
  
  const handleGoToLibrary = () => {
    navigate('/library');
  };

  return (
    <MainLayoutWithPlayer>
      <ScrollToTop />
      <div className="container max-w-3xl py-12 px-4">
        <Card className="border-green-200 bg-green-50/30 dark:bg-green-900/10">
          <CardHeader className="text-center pb-4">
            {loading ? (
              <>
                <div className="w-full flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
                </div>
                <CardTitle className="text-2xl">Processing Your Payment</CardTitle>
                <CardDescription className="text-base mt-2">
                  Please wait while we confirm your transaction...
                </CardDescription>
              </>
            ) : error ? (
              <>
                <CardTitle className="text-2xl text-red-600">Payment Verification Issue</CardTitle>
                <CardDescription className="text-base mt-2 text-red-500">
                  {error}
                </CardDescription>
              </>
            ) : (
              <>
                <div className="w-full flex justify-center mb-4">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl text-green-700">Payment Successful!</CardTitle>
                <CardDescription className="text-base mt-2">
                  Thank you for your purchase. Your beats have been added to your library.
                </CardDescription>
              </>
            )}
          </CardHeader>
          
          {!loading && !error && (
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="bg-green-100 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center">
                    <Music className="h-5 w-5 text-green-600 mr-2" />
                    <p className="font-medium text-green-800 dark:text-green-300">
                      Your purchased beats are ready to use
                    </p>
                  </div>
                  <p className="text-sm mt-2 text-green-700/80 dark:text-green-400/80">
                    You can download your beats and access your licenses from your library
                  </p>
                </div>
                
                <Button 
                  onClick={handleGoToLibrary}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  Go to My Library
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </MainLayoutWithPlayer>
  );
}
