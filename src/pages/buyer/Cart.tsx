
import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, AlertCircle, Music, Play, Pause, Trash2 } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { usePlayer } from "@/context/PlayerContext";
import { Badge } from '@/components/ui/badge';
import { getLicensePrice } from '@/utils/licenseUtils';
import { PaymentHandler } from '@/components/payment/PaymentHandler';
import { supabase } from '@/integrations/supabase/client';
import { SolanaCheckoutDialog } from "@/components/payment/SolanaCheckoutDialog";
import WalletButton from "@/components/wallet/WalletButton";
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletSync } from '@/hooks/useWalletSync';
import { Skeleton } from '@/components/ui/skeleton';

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount, refreshCart } = useCart();
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
  
  // Simplified UI state management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSolanaDialogOpen, setIsSolanaDialogOpen] = useState(false);
  const [beatsWithWalletAddresses, setBeatsWithWalletAddresses] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Initialize cart with simplified loading
  useEffect(() => {
    const initializeCart = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check for recent purchase success
        const purchaseSuccess = localStorage.getItem('purchaseSuccess');
        if (purchaseSuccess === 'true') {
          const purchaseTime = localStorage.getItem('purchaseTime');
          const now = Date.now();
          
          if (purchaseTime && (now - parseInt(purchaseTime)) < 5 * 60 * 1000) {
            handlePurchaseSuccess();
            return;
          } else {
            // Clear stale purchase data
            localStorage.removeItem('purchaseSuccess');
            localStorage.removeItem('purchaseTime');
            localStorage.removeItem('pendingOrderId');
            localStorage.removeItem('paystackReference');
            localStorage.removeItem('paymentInProgress');
          }
        }
        
        // Refresh cart if needed
        if (cartItems && cartItems.length > 0) {
          await refreshCart();
        }
      } catch (err) {
        console.error('Error initializing cart:', err);
        setError('Failed to load cart. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeCart();
    
    // Setup purchase listener
    const subscription = supabase
      .channel('purchased-beats-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user?.id}`
        },
        () => {
          console.log('New purchase detected');
          handlePurchaseSuccess();
        }
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);
  
  const handlePurchaseSuccess = () => {
    clearCart();
    localStorage.setItem('purchaseSuccess', 'true');
    localStorage.setItem('purchaseTime', Date.now().toString());
    
    toast.success('Payment successful! Redirecting to your library...');
    
    setTimeout(() => {
      localStorage.removeItem('purchaseSuccess');
      localStorage.removeItem('purchaseTime');
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
      localStorage.removeItem('paymentInProgress');
      window.location.href = '/library';
    }, 1500);
  };
  
  // Simplified item removal
  const handleRemoveItem = async (beatId: string) => {
    try {
      await removeFromCart(beatId);
      toast.success("Item removed from cart");
    } catch (error) {
      toast.error("Failed to remove item");
    }
  };
  
  // Simplified cart clearing
  const handleClearCart = () => {
    clearCart();
    toast.success("Cart cleared successfully");
  };
  
  // Beat playback control
  const handlePlayBeat = (beat: any) => {
    if (currentBeat?.id === beat.id) {
      playBeat(isPlaying ? null : beat);
    } else {
      playBeat(beat);
    }
  };
  
  // Simplified Solana checkout
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
    
    if (needsAuth || walletMismatch || !isWalletSynced) {
      toast.error('Please ensure your wallet is properly connected and synced');
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      // Get producer wallet addresses
      const beatProducerIds = cartItems.map(item => item.beat.producer_id);
      
      const { data: producersData, error } = await supabase
        .from('users')
        .select('id, wallet_address, stage_name')
        .in('id', beatProducerIds);
      
      if (error) {
        throw new Error('Failed to validate producer payment information');
      }
      
      // Check for missing wallet addresses
      const producerWallets: Record<string, string> = {};
      const producersWithoutWallets: string[] = [];
      
      if (producersData) {
        producersData.forEach(producer => {
          if (producer.wallet_address) {
            producerWallets[producer.id] = producer.wallet_address;
          } else {
            producersWithoutWallets.push(producer.stage_name || 'Unknown Producer');
          }
        });
      }
      
      if (producersWithoutWallets.length > 0) {
        throw new Error(`Some producers haven't set up their Solana wallets: ${producersWithoutWallets.join(', ')}`);
      }
      
      // Update cart items with wallet addresses
      const updatedCartItems = cartItems.map(item => ({
        ...item,
        beat: {
          ...item.beat,
          producer_wallet_address: producerWallets[item.beat.producer_id]
        }
      }));
      
      setBeatsWithWalletAddresses(updatedCartItems);
      setIsSolanaDialogOpen(true);
    } catch (err: any) {
      console.error('Error processing Solana checkout:', err);
      toast.error(err.message || 'Error preparing checkout');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getItemPrice = (item: any) => {
    const licenseType = item.beat.selected_license || 'basic';
    return getLicensePrice(item.beat, licenseType, currency === 'USD');
  };
  
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
  
  // Wallet connection status for USD payments
  const getWalletStatus = () => {
    if (!user) return { disabled: true, text: 'Login Required' };
    if (!isConnected) return { disabled: true, text: 'Connect Wallet First' };
    if (needsAuth) return { disabled: true, text: 'Login to Sync Wallet' };
    if (walletMismatch) return { disabled: true, text: 'Wrong Wallet Connected' };
    if (syncStatus === 'syncing') return { disabled: true, text: 'Syncing Wallet...' };
    if (syncStatus === 'error') return { disabled: true, text: 'Sync Failed' };
    if (!isWalletSynced) return { disabled: true, text: 'Wallet Not Synced' };
    return { disabled: false, text: `Pay with USDC ($${totalAmount})` };
  };

  const walletStatus = getWalletStatus();
  
  // Loading skeleton
  if (isLoading) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8 pb-32 md:pb-8">
          <div className="mb-6">
            <Skeleton className="h-8 w-64 mb-2" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-xl p-3 flex gap-3">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  // Error state
  if (error) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8 pb-32 md:pb-8">
          <div className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
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
            <h1 className="text-2xl font-bold">Your Cart ({cartItems?.length || 0} items)</h1>
          </div>
        </div>

        {(!cartItems || cartItems.length === 0) ? (
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Browse our marketplace to find beats you'd like to purchase.
            </p>
            <Button onClick={() => navigate('/')}>
              Continue Shopping
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={`${item.beat.id}-${item.added_at}`} className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-4 flex gap-4">
                    <div className="flex-shrink-0 w-16 h-16">
                      <div
                        className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer group"
                        onClick={() => handlePlayBeat(item.beat)}
                      >
                        <img
                          src={item.beat.cover_image_url || "/placeholder.svg"}
                          alt={item.beat.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/placeholder.svg";
                          }}
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
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">{item.beat.title}</h3>
                          <p className="text-sm text-muted-foreground truncate">{item.beat.producer_name}</p>
                          
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {item.beat.genre && (
                              <Badge variant="outline" className="text-xs py-0 px-2">
                                <Music size={10} className="mr-1" />
                                {item.beat.genre}
                              </Badge>
                            )}
                            
                            <Badge variant="secondary" className="text-xs py-0 px-2 capitalize">
                              {item.beat.selected_license || 'Basic'} License
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end ml-4">
                          <span className="font-semibold text-lg">
                            {currency === 'NGN' ? '₦' : '$'}
                            {getItemPrice(item).toLocaleString()}
                          </span>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive mt-2"
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
                  onClick={handleClearCart}
                  className="text-muted-foreground"
                >
                  Clear Cart
                </Button>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <Card className="sticky top-24 overflow-hidden border-primary/10 shadow-md">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-primary/10">
                  <CardTitle className="text-xl">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal ({cartItems?.length || 0} items)</span>
                      <span className="font-medium">
                        {currency === 'NGN' ? '₦' : '$'}{totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <Separator className="my-3" />
                  
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">
                      {currency === 'NGN' ? '₦' : '$'}{totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {/* Solana wallet section for USD payments */}
                  {currency === 'USD' && (
                    <div className="mt-4 py-3 px-4 bg-secondary/30 rounded-md flex flex-col gap-3">
                      <div className="text-sm font-medium">Pay with USDC on Solana</div>
                      <div className="w-full">
                        <WalletButton buttonClass="w-full justify-center" />
                      </div>
                      
                      {/* Status messages */}
                      <div className="text-xs text-center">
                        {!user && (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Login required to sync wallet</span>
                        )}
                        {user && !isConnected && (
                          <span className="text-gray-600 dark:text-gray-400">Connect your wallet to continue</span>
                        )}
                        {user && isConnected && needsAuth && (
                          <span className="text-amber-600 dark:text-amber-400">⚠️ Please log in to sync wallet</span>
                        )}
                        {user && isConnected && walletMismatch && (
                          <span className="text-red-600 dark:text-red-400">
                            ⚠️ Wallet mismatch - use "Force Sync" or connect saved wallet ({storedWalletAddress?.slice(0, 8)}...)
                          </span>
                        )}
                        {user && isConnected && !needsAuth && !walletMismatch && syncStatus === 'syncing' && (
                          <span className="text-amber-600 dark:text-amber-400">⏳ Syncing wallet... Please wait</span>
                        )}
                        {user && isConnected && !needsAuth && !walletMismatch && syncStatus === 'error' && (
                          <span className="text-red-600 dark:text-red-400">❌ Sync failed - try "Force Sync"</span>
                        )}
                        {user && isWalletSynced && syncStatus === 'success' && (
                          <span className="text-green-600 dark:text-green-400">✓ Wallet connected and synced</span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 p-5 bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-primary/10">
                  {currency === 'NGN' ? (
                    <PaymentHandler 
                      totalAmount={totalAmount} 
                      onSuccess={handlePurchaseSuccess}
                    />
                  ) : (
                    <Button
                      onClick={handleOpenSolanaCheckout}
                      className="w-full py-6 text-base shadow-md hover:shadow-lg transition-all duration-300"
                      variant="premium"
                      size="lg"
                      disabled={walletStatus.disabled || isProcessingPayment}
                    >
                      {isProcessingPayment ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Preparing...
                        </>
                      ) : (
                        walletStatus.text
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full shadow-sm hover:shadow transition-all"
                    onClick={() => navigate('/')}
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
        onCheckoutSuccess={handlePurchaseSuccess}
      />
    </MainLayoutWithPlayer>
  );
}
