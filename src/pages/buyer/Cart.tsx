
import React, { useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { Button } from "@/components/ui/button";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Cart() {
  const { cartItems, removeFromCart, clearCart, totalAmount } = useCart();
  const { user, currency } = useAuth();
  const { toggleFavorite, isFavorite } = useBeats();
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
                  <BeatListItem 
                    key={item.beat.id}
                    beat={item.beat}
                    isInCart={true}
                    isFavorite={isFavorite(item.beat.id)}
                    onRemove={handleRemoveItem}
                    onToggleFavorite={toggleFavorite}
                  />
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
}
