
import React, { useEffect, useState, useCallback } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, AlertCircle, Music, Play, Pause, Trash2, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayer } from "@/context/PlayerContext";
import { Badge } from '@/components/ui/badge';
import { getLicensePrice } from '@/utils/licenseUtils';
import { PaymentHandler } from '@/components/payment/PaymentHandler';
import { supabase } from '@/integrations/supabase/client';
import { SolanaCheckoutDialog } from "@/components/payment/SolanaCheckoutDialog";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount, refreshCart } = useCart();
  const { user, currency } = useAuth();
  const { toggleFavorite, isFavorite, fetchPurchasedBeats } = useBeats();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectingFromPayment, setRedirectingFromPayment] = useState(false);
  const [isSolanaDialogOpen, setIsSolanaDialogOpen] = useState(false);
  const [beatsWithWalletAddresses, setBeatsWithWalletAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartKey, setCartKey] = useState(() => Date.now()); // Force re-render with a key
  
  // Update cart key when cartItems change to force re-render
  useEffect(() => {
    setCartKey(Date.now());
    setIsLoading(false);
  }, [cartItems]);
  
  // Custom wrapper for removeFromCart to ensure UI updates
  const handleRemoveItem = async (beatId) => {
    console.log("Handling remove item:", beatId);
    try {
      await removeFromCart(beatId);
      // Force component re-render
      setCartKey(Date.now());
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };
  
  // Custom wrapper for clearCart to ensure UI updates
  const handleClearCart = () => {
    console.log("Handling clear cart");
    try {
      clearCart();
      // Force component re-render
      setCartKey(Date.now());
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    }
  };
  
  const handlePaymentSuccess = () => {
    console.log("Payment success handler in Cart called");
    // Clear the cart
    clearCart();
    
    // Set flag for successful purchase
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    // Show success toast
    toast.success('Payment successful! Redirecting to your library...');
    
    // Force redirect to library
    window.location.href = '/library';
  };
  
  const handleContinueShopping = () => {
    navigate('/');
  };

  const handlePlayBeat = (beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        playBeat(null);
      } else {
        playBeat(beat);
      }
    } else {
      playBeat(beat);
    }
  };
  
  const handleOpenSolanaCheckout = async () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    setIsLoading(true);
    
    // Fetch latest producer wallet data for items in cart
    const beatProducerIds = cartItems.map(item => item.beat.producer_id);
    
    try {
      const { data: producersData, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .in('id', beatProducerIds);
      
      if (error) {
        console.error('Error fetching producer wallet data:', error);
        toast.error('Error validating producer payment information');
        setIsLoading(false);
        return;
      }
      
      // Create a map of producer IDs to wallet addresses
      const producerWallets = {};
      producersData.forEach(producer => {
        producerWallets[producer.id] = producer.wallet_address;
        console.log(`Producer ${producer.id} wallet: ${producer.wallet_address}`);
      });
      
      // Check if any producer is missing a wallet address
      const missingWalletProducers = cartItems.filter(item => {
        const hasWallet = !!producerWallets[item.beat.producer_id];
        console.log(`Item ${item.beat.id} producer ${item.beat.producer_id} has wallet: ${hasWallet}`);
        return !hasWallet;
      });
      
      if (missingWalletProducers.length > 0) {
        console.error("Missing wallet addresses for producers:", 
          missingWalletProducers.map(item => ({
            beatId: item.beat.id,
            producerId: item.beat.producer_id,
            title: item.beat.title
          }))
        );
        
        toast.error('Some producers have not set up their wallet address. Please remove those items or try again later.');
        setIsLoading(false);
        return;
      }
      
      // Update cart items with wallet addresses for checkout
      const updatedCartItems = cartItems.map(item => ({
        ...item,
        beat: {
          ...item.beat,
          producer_wallet_address: producerWallets[item.beat.producer_id]
        }
      }));
      
      console.log("Cart items with wallet addresses:", updatedCartItems);
      
      setBeatsWithWalletAddresses(updatedCartItems);
      setIsLoading(false);
      setIsSolanaDialogOpen(true);
    } catch (err) {
      console.error('Error processing Solana checkout:', err);
      toast.error('Error preparing checkout information');
      setIsLoading(false);
    }
  };

  // Listen for purchases to update the cart
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('purchased-beats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New purchase detected in Cart:', payload);
          fetchPurchasedBeats().then(() => {
            clearCart();
            localStorage.setItem('purchaseSuccess', 'true');
            localStorage.setItem('purchaseTime', Date.now().toString());
            
            // Force redirect to library
            window.location.href = '/library';
          });
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPurchasedBeats, clearCart]);

  // Component initialization
  useEffect(() => {
    document.title = "Shopping Cart | OrderSOUNDS";
    
    // Ensure we have the latest cart data and producer wallet addresses
    const initializeCart = async () => {
      setIsLoading(true);
      await refreshCart();
      setIsLoading(false);
    };
    
    initializeCart();
    
    // Handle purchase success redirect
    const purchaseSuccess = localStorage.getItem('purchaseSuccess');
    const paymentInProgress = localStorage.getItem('paymentInProgress');
    
    if (purchaseSuccess === 'true' && !redirectingFromPayment) {
      setRedirectingFromPayment(true);
      
      console.log('Detected successful purchase, redirecting to library...');
      clearCart();
      
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      localStorage.removeItem('paymentInProgress');
      
      window.location.href = '/library';
    }
    
    // Clean up stale payment session
    if (paymentInProgress === 'true') {
      const purchaseTime = localStorage.getItem('purchaseTime');
      const now = Date.now();
      const timeDiff = purchaseTime ? now - parseInt(purchaseTime) : 0;
      
      if (timeDiff > 5 * 60 * 1000) {
        localStorage.removeItem('paymentInProgress');
        localStorage.removeItem('purchaseTime');
      }
    }
  }, [refreshCart, clearCart, redirectingFromPayment]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (!redirectingFromPayment) {
        localStorage.removeItem('pendingOrderId');
        localStorage.removeItem('paystackReference');
        localStorage.removeItem('orderItems');
      }
    };
  }, [redirectingFromPayment]);

  const getItemPrice = (item) => {
    const licenseType = item.beat.selected_license || 'basic';
    return getLicensePrice(item.beat, licenseType, currency === 'USD');
  };
  
  // Prepare cart items for Solana checkout
  const prepareSolanaCartItems = () => {
    const itemsToUse = beatsWithWalletAddresses.length > 0 ? beatsWithWalletAddresses : cartItems;
    
    return itemsToUse.map(item => {
      const beat = item.beat;
      const price = getItemPrice(item);
      
      return {
        id: beat.id,
        title: beat.title,
        price: price,
        thumbnail_url: beat.cover_image_url,
        quantity: 1,
        producer_wallet: beat.producer_wallet_address || '' 
      };
    });
  };
  
  // Handle refresh cart button
  const handleRefreshCart = async () => {
    setIsLoading(true);
    await refreshCart();
    setCartKey(Date.now()); // Force re-render after refresh
    setIsLoading(false);
    toast.success("Cart refreshed");
  };
  
  if (isLoading) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8 pb-32 md:pb-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading your cart...</p>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }
  
  // Re-render the component whenever cart changes by using the key
  return (
    <MainLayoutWithPlayer key={cartKey}>
      <div className="container py-8 pb-32 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6" />
            <h1 className="text-2xl font-bold">Your Cart ({cartItems.length} items)</h1>
          </div>
          
          {cartItems.length > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefreshCart}
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              <span>Refresh</span>
            </Button>
          )}
        </div>

        {(!cartItems || cartItems.length === 0) ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our marketplace to find beats you'd like to purchase.
            </p>
            <Button onClick={handleContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.beat.id}-${cartKey}`} className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
                    <div className="flex-shrink-0 w-16 h-16">
                      <div
                        className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer group"
                        onClick={() => handlePlayBeat(item.beat)}
                      >
                        <img
                          src={item.beat.cover_image_url}
                          alt={item.beat.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isPlaying && currentBeat?.id === item.beat.id ? (
                            <Pause className="h-6 w-6 text-white" />
                          ) : (
                            <Play className="h-6 w-6 ml-1 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold truncate">{item.beat.title}</h3>
                          <p className="text-xs text-muted-foreground">{item.beat.producer_name}</p>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.beat.genre && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5">
                                <Music size={10} className="mr-1" />
                                {item.beat.genre}
                              </Badge>
                            )}
                            
                            <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                              {item.beat.selected_license || 'Basic'} License
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-sm">
                            {currency === 'NGN' ? '₦' : '$'}
                            {getItemPrice(item).toLocaleString()}
                          </span>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
                            onClick={() => handleRemoveItem(item.beat.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  className="text-muted-foreground"
                  onClick={handleClearCart}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                      <span>
                        {currency === 'NGN' ? (
                          <span>₦{totalAmount.toLocaleString()}</span>
                        ) : (
                          <span>${totalAmount.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>
                      {currency === 'NGN' ? (
                        <span>₦{totalAmount.toLocaleString()}</span>
                      ) : (
                        <span>${totalAmount.toLocaleString()}</span>
                      )}
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2">
                  {currency === 'NGN' ? (
                    <PaymentHandler 
                      totalAmount={totalAmount} 
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <Button
                      onClick={handleOpenSolanaCheckout}
                      className="w-full py-6 text-base"
                      size="lg"
                      disabled={cartItems.length === 0}
                    >
                      Pay with Solana ($)
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleContinueShopping}
                  >
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      <SolanaCheckoutDialog
        open={isSolanaDialogOpen}
        onOpenChange={setIsSolanaDialogOpen}
        cartItems={prepareSolanaCartItems()}
        onCheckoutSuccess={handlePaymentSuccess}
      />
    </MainLayoutWithPlayer>
  );
}
