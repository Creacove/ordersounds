
import React, { useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Button } from "@/components/ui/button";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, AlertCircle, Play, Pause, Music, Tag, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePlayer } from "@/context/PlayerContext";
import { Badge } from "@/components/ui/badge";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, currency } = useAuth();
  const { toggleFavorite, isFavorite } = useBeats();
  const { isPlaying, currentBeat, playBeat, togglePlayPause } = usePlayer();
  const navigate = useNavigate();
  
  const handleRemoveItem = (beatId: string) => {
    removeFromCart(beatId);
    toast.success("Item removed from cart");
  };
  
  const handleCheckout = () => {
    // Placeholder for checkout functionality
    toast.info("Checkout functionality coming soon!");
  };
  
  const handleContinueShopping = () => {
    navigate('/');
  };

  const handlePlayBeat = (beat) => {
    if (currentBeat?.id === beat.id) {
      togglePlayPause();
    } else {
      playBeat(beat);
    }
  };

  useEffect(() => {
    document.title = "Shopping Cart | OrderSOUNDS";
  }, []);

  if (!user) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-12 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your cart</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to add items to your cart and complete purchases.
            </p>
            <Button asChild>
              <a href="/login">Sign In</a>
            </Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8 pb-32 md:pb-8">
        <div className="flex items-center mb-6">
          <ShoppingCart className="mr-2 h-6 w-6" />
          <h1 className="text-2xl font-bold">Your Cart</h1>
        </div>

        {cartItems.length === 0 ? (
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
                  <div key={item.beat.id} className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
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
                            <Badge variant="outline" className="text-xs py-0 px-1.5">
                              <Music size={10} className="mr-1" />
                              {item.beat.genre}
                            </Badge>
                            
                            <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                              {item.beat.selected_license || 'Basic'} License
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-sm">
                            {currency === 'NGN' ? '₦' : '$'}
                            {currency === 'NGN' 
                              ? getLicensePrice(item.beat, item.beat.selected_license || 'basic', false).toLocaleString() 
                              : getLicensePrice(item.beat, item.beat.selected_license || 'basic', true).toLocaleString()}
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
                  onClick={clearCart}
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
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>
                  
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
    </MainLayoutWithPlayer>
  );
};

// Helper function to get the correct price based on license type
function getLicensePrice(beat, licenseType = 'basic', isForeign = false) {
  if (!beat) return 0;
  
  const priceMap = {
    basic: {
      local: beat.basic_license_price_local || beat.price_local * 0.5,
      diaspora: beat.basic_license_price_diaspora || beat.price_diaspora * 0.5
    },
    premium: {
      local: beat.premium_license_price_local || beat.price_local,
      diaspora: beat.premium_license_price_diaspora || beat.price_diaspora
    },
    exclusive: {
      local: beat.exclusive_license_price_local || beat.price_local * 3,
      diaspora: beat.exclusive_license_price_diaspora || beat.price_diaspora * 3
    }
  };
  
  return isForeign ? priceMap[licenseType].diaspora : priceMap[licenseType].local;
}
