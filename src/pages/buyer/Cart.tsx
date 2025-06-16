
import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCartWithBeatDetails } from "@/hooks/useCartWithBeatDetails";
import { useAuth } from "@/context/AuthContext";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Music, Play, Pause, Trash2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayer } from "@/context/PlayerContext";
import { Badge } from '@/components/ui/badge';
import { PaymentHandler } from '@/components/payment/PaymentHandler';
import { supabase } from '@/integrations/supabase/client';
import { SolanaCheckoutDialog } from "@/components/payment/SolanaCheckoutDialog";
import WalletButton from "@/components/wallet/WalletButton";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSync } from '@/hooks/useWalletSync';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount, itemCount, isLoading, refreshCartFromStorage } = useCartWithBeatDetails();
  const { user, currency } = useAuth();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const navigate = useNavigate();
  const wallet = useWallet();
  const { 
    isWalletSynced, 
    needsAuth, 
    isConnected, 
    walletMismatch, 
    storedWalletAddress,
    syncStatus 
  } = useWalletSync();
  
  // UI state management
  const [isSolanaDialogOpen, setIsSolanaDialogOpen] = useState(false);
  const [beatsWithWalletAddresses, setBeatsWithWalletAddresses] = useState([]);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const [isPreparingCheckout, setIsPreparingCheckout] = useState(false);

  // Force refresh cart on mount
  useEffect(() => {
    if (refreshCartFromStorage) {
      refreshCartFromStorage();
    }
    
    // Also dispatch event to refresh cart
    window.dispatchEvent(new CustomEvent('forceCartRefresh'));
  }, [refreshCartFromStorage]);

  // Check for purchase success on mount
  useEffect(() => {
    const checkPurchaseStatus = () => {
      const purchaseSuccess = localStorage.getItem('purchaseSuccess');
      if (purchaseSuccess === 'true') {
        const purchaseTime = localStorage.getItem('purchaseTime');
        const now = Date.now();
        
        if (purchaseTime && (now - parseInt(purchaseTime)) < 5 * 60 * 1000) {
          setPurchaseComplete(true);
          toast.success('Payment successful! Redirecting to your library...');
          
          setTimeout(() => {
            localStorage.removeItem('purchaseSuccess');
            localStorage.removeItem('purchaseTime');
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('paystackReference');
            localStorage.removeItem('paymentInProgress');
            
            window.location.href = '/library';
          }, 1500);
          return true;
        } else {
          localStorage.removeItem('purchaseSuccess');
          localStorage.removeItem('purchaseTime');
          localStorage.removeItem('pendingOrderId');
          localStorage.removeItem('paystackReference');
          localStorage.removeItem('paymentInProgress');
        }
      }
      return false;
    };
    
    if (checkPurchaseStatus()) {
      return;
    }
    
    // Setup purchase listener
    const setupPurchaseListener = () => {
      if (!user) return { unsubscribe: () => {} };
      
      return supabase
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
            clearCart();
            localStorage.setItem('purchaseSuccess', 'true');
            localStorage.setItem('purchaseTime', Date.now().toString());
            
            window.location.href = '/library';
          }
        )
        .subscribe();
    };
    
    const subscription = setupPurchaseListener();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, clearCart]);
  
  // Handle remove item
  const handleRemoveItem = async (beatId: string) => {
    try {
      removeFromCart(beatId);
      toast.success("Item removed from cart");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };
  
  // Handle complete cart clearing
  const handleClearCart = () => {
    try {
      clearCart();
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Failed to clear cart");
    }
  };
  
  // Handle successful payment
  const handlePaymentSuccess = () => {
    clearCart();
    
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    toast.success('Payment successful! Redirecting to your library...');
    setPurchaseComplete(true);
    
    setTimeout(() => {
      window.location.href = '/library';
    }, 1500);
  };
  
  // Navigation functions
  const handleContinueShopping = () => {
    navigate('/');
  };

  // Beat playback control
  const handlePlayBeat = (beat: any) => {
    if (currentBeat?.id === beat.id) {
      playBeat(isPlaying ? null : beat);
    } else {
      playBeat(beat);
    }
  };
  
  // Enhanced Solana checkout
  const handleOpenSolanaCheckout = async () => {
    if (!cartItems || cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!user) {
      toast.error('Please log in to make a purchase');
      navigate('/login');
      return;
    }
    
    if (!isConnected) {
      toast.error('Please connect your Solana wallet first');
      return;
    }
    
    if (needsAuth) {
      toast.error('Please log in to sync your wallet');
      navigate('/login');
      return;
    }

    if (walletMismatch) {
      toast.error(`Connected wallet doesn't match your saved wallet. Please use "Force Sync" to update your saved wallet.`);
      return;
    }
    
    if (syncStatus === 'syncing') {
      toast.error('Please wait for wallet to sync with your account');
      return;
    }
    
    if (syncStatus === 'error') {
      toast.error('Wallet sync failed. Please try "Force Sync" or reconnect your wallet');
      return;
    }
    
    if (!isWalletSynced) {
      toast.error('Wallet not synced. Please try "Force Sync" or reconnect your wallet');
      return;
    }
    
    console.log("✅ All checks passed, opening Solana checkout dialog");
    setIsPreparingCheckout(true);
    
    try {
      const beatProducerIds = cartItems.map(item => item.beat?.producer_id).filter(Boolean);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const fetchPromise = supabase
        .from('users')
        .select('id, wallet_address, stage_name')
        .in('id', beatProducerIds);
        
      const response = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as { data: any[] | null; error: any };
      
      const producersData = response?.data;
      const error = response?.error;
      
      if (error) {
        throw new Error('Error validating producer payment information');
      }
      
      const producerWallets: Record<string, string> = {};
      const producersWithoutWallets: string[] = [];
      
      if (producersData && Array.isArray(producersData)) {
        producersData.forEach(producer => {
          if (producer.wallet_address) {
            producerWallets[producer.id] = producer.wallet_address;
          } else {
            producersWithoutWallets.push(producer.stage_name || 'Unknown Producer');
          }
        });
      }
      
      if (producersWithoutWallets.length > 0) {
        throw new Error(`The following producers haven't set up their Solana wallet addresses: ${producersWithoutWallets.join(', ')}. Please remove these items or try again later.`);
      }
      
      const updatedCartItems = cartItems.map(item => ({
        ...item,
        beat: {
          ...item.beat,
          producer_wallet_address: producerWallets[item.beat?.producer_id || '']
        }
      }));
      
      setBeatsWithWalletAddresses(updatedCartItems);
      setIsSolanaDialogOpen(true);
    } catch (err: any) {
      console.error('Error processing Solana checkout:', err);
      toast.error(err.message || 'Error preparing checkout information');
    } finally {
      setIsPreparingCheckout(false);
    }
  };

  // Prepare items for Solana checkout
  const prepareSolanaCartItems = () => {
    const itemsToUse = beatsWithWalletAddresses.length > 0 ? beatsWithWalletAddresses : cartItems;
    
    return itemsToUse.map((item: any) => {
      const beat = item.beat;
      const price = totalAmount / cartItems.length; // Simple division for now
      
      return {
        id: beat?.id || '',
        title: beat?.title || '',
        price: price,
        thumbnail_url: beat?.cover_image_url || '',
        quantity: 1,
        producer_wallet: beat?.producer_wallet_address || '' 
      };
    });
  };
  
  // Simple loading view
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

  // Purchase complete view
  if (purchaseComplete) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8 pb-32 md:pb-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Payment Successful!</h2>
            <p className="text-muted-foreground mb-6">
              Redirecting to your library...
            </p>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }
  
  // Main cart view
  return (
    <MainLayoutWithPlayer>
      <div className="container py-8 pb-32 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <ShoppingCart className="mr-2 h-6 w-6" />
            <h1 className="text-2xl font-bold">Your Cart ({itemCount} items)</h1>
          </div>
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
                  <div key={`${item.beatId}-${item.addedAt}`} className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
                    <div className="flex-shrink-0 w-16 h-16">
                      <div
                        className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer group"
                        onClick={() => item.beat && handlePlayBeat(item.beat)}
                      >
                        <img
                          src={item.beat?.cover_image_url || "/placeholder.svg"}
                          alt={item.beat?.title || "Beat"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          {isPlaying && currentBeat?.id === item.beat?.id ? (
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
                          <h3 className="font-semibold truncate">{item.beat?.title || 'Unknown Beat'}</h3>
                          <p className="text-xs text-muted-foreground">{item.beat?.producer_name || 'Unknown Producer'}</p>
                          
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {item.beat?.genre && (
                              <Badge variant="outline" className="text-xs py-0 px-1.5">
                                <Music size={10} className="mr-1" />
                                {item.beat.genre}
                              </Badge>
                            )}
                            
                            <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                              {item.licenseType} License
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-sm">
                            {currency === 'NGN' ? '₦' : '$'}
                            {Math.round(totalAmount / cartItems.length).toLocaleString()}
                          </span>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
                            onClick={() => handleRemoveItem(item.beatId)}
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
              <Card className="sticky top-24 overflow-hidden border-primary/10 shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
                      <span className="font-medium">
                        {currency === 'NGN' ? (
                          <span>₦{totalAmount.toLocaleString()}</span>
                        ) : (
                          <span>${totalAmount.toLocaleString()}</span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      {currency === 'NGN' ? (
                        <span>₦{totalAmount.toLocaleString()}</span>
                      ) : (
                        <span>${totalAmount.toLocaleString()}</span>
                      )}
                    </span>
                  </div>

                  {currency === 'USD' && (
                    <div className="mt-4 py-3 px-4 bg-secondary/30 rounded-md flex flex-col gap-3">
                      <div className="text-sm font-medium">Pay with USDC on Solana</div>
                      <div className="w-full">
                        <WalletButton buttonClass="w-full justify-center" />
                      </div>
                      
                      {!user && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 text-center">
                          ⚠️ Login required to sync wallet
                        </div>
                      )}
                      {user && !isConnected && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 text-center">
                          Connect your wallet to continue
                        </div>
                      )}
                      {user && isConnected && needsAuth && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 text-center">
                          ⚠️ Please log in to sync wallet
                        </div>
                      )}
                      {user && isConnected && walletMismatch && (
                        <div className="text-xs text-red-600 dark:text-red-400 text-center">
                          ⚠️ Wallet mismatch - use "Force Sync" or connect saved wallet ({storedWalletAddress?.slice(0, 8)}...)
                        </div>
                      )}
                      {user && isConnected && !needsAuth && !walletMismatch && syncStatus === 'syncing' && (
                        <div className="text-xs text-amber-600 dark:text-amber-400 text-center">
                          ⏳ Syncing wallet... Please wait
                        </div>
                      )}
                      {user && isConnected && !needsAuth && !walletMismatch && syncStatus === 'error' && (
                        <div className="text-xs text-red-600 dark:text-red-400 text-center">
                          ❌ Sync failed - try "Force Sync"
                        </div>
                      )}
                      {user && isWalletSynced && syncStatus === 'success' && (
                        <div className="text-xs text-green-600 dark:text-green-400 text-center">
                          ✓ Wallet connected and synced
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 p-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-primary/10">
                  {currency === 'NGN' ? (
                    <PaymentHandler 
                      totalAmount={totalAmount} 
                      onSuccess={handlePaymentSuccess}
                    />
                  ) : (
                    <Button
                      onClick={handleOpenSolanaCheckout}
                      className="w-full py-6 text-base shadow-md hover:shadow-lg transition-all duration-300"
                      variant="premium"
                      size="lg"
                      disabled={!cartItems || cartItems.length === 0 || isPreparingCheckout || !user || !isConnected || needsAuth || walletMismatch || syncStatus === 'syncing' || syncStatus === 'error' || !isWalletSynced}
                    >
                      {isPreparingCheckout ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Preparing...
                        </>
                      ) : !user ? (
                        <>Login Required</>
                      ) : !isConnected ? (
                        <>Connect Wallet First</>
                      ) : needsAuth ? (
                        <>Login to Sync Wallet</>
                      ) : walletMismatch ? (
                        <>Wrong Wallet Connected</>
                      ) : syncStatus === 'syncing' ? (
                        <>Syncing Wallet...</>
                      ) : syncStatus === 'error' ? (
                        <>Sync Failed - Try Force Sync</>
                      ) : !isWalletSynced ? (
                        <>Wallet Not Synced</>
                      ) : (
                        <>Pay with USDC (${totalAmount})</>
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full shadow-sm hover:shadow transition-all"
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
