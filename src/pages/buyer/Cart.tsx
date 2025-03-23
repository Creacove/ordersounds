
import React from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, TrashIcon, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PriceTag } from "@/components/ui/PriceTag";
import { toast } from "sonner";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, currency } = useAuth();
  const navigate = useNavigate();
  
  const handleRemoveItem = (beatId: string) => {
    removeFromCart(beatId);
  };
  
  const handleCheckout = () => {
    // Placeholder for checkout functionality
    toast.info("Checkout functionality coming soon!");
  };
  
  const handleContinueShopping = () => {
    navigate('/');
  };

  React.useEffect(() => {
    document.title = "Shopping Cart | Creacove";
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
      <div className="container py-8">
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
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.beat.id} className="bg-card rounded-lg shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="w-full sm:w-1/3 md:w-1/4">
                        <BeatCard 
                          beat={item.beat} 
                          isInCart={true}
                          className="shadow-none border-0"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{item.beat.title}</h3>
                          <p className="text-muted-foreground">
                            Producer: {item.beat.producer_name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.beat.genre} · {item.beat.bpm} BPM
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveItem(item.beat.id)}
                            className="text-destructive hover:text-destructive/90 p-0 h-auto"
                          >
                            Remove
                          </Button>
                          <div className="font-medium">
                            {currency === 'NGN' ? (
                              <span>₦{item.beat.price_local.toLocaleString()}</span>
                            ) : (
                              <span>${item.beat.price_diaspora.toLocaleString()}</span>
                            )}
                          </div>
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
              <div className="bg-card rounded-lg shadow-sm p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-2 mb-4">
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
                
                <div className="flex justify-between font-semibold text-lg mb-6">
                  <span>Total</span>
                  <span>
                    {currency === 'NGN' ? (
                      <span>₦{totalAmount.toLocaleString()}</span>
                    ) : (
                      <span>${totalAmount.toLocaleString()}</span>
                    )}
                  </span>
                </div>
                
                <Button 
                  className="w-full mb-3" 
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
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
