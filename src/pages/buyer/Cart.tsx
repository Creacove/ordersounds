
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { CartItemCard } from "@/components/cart/CartItemCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartWithBeatDetailsOptimized } from "@/hooks/useCartWithBeatDetailsOptimized";
import { ShoppingCart, CreditCard } from "lucide-react";
import { PaymentHandler } from "@/components/payment/PaymentHandler";
import { WalletAuthPrompt } from "@/components/wallet/WalletAuthPrompt";
import { WalletDependentWrapper } from "@/components/wallet/WalletDependentWrapper";
import { useWallet } from "@solana/wallet-adapter-react";

const CartContent = () => {
  const { 
    cartItems, 
    totalPrice, 
    isLoading, 
    error, 
    removeFromCart, 
    updateQuantity,
    clearCart 
  } = useCartWithBeatDetailsOptimized();

  let wallet;
  try {
    wallet = useWallet();
  } catch (error) {
    wallet = { connected: false, publicKey: null };
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">Error loading cart: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-4">
              Browse our collection and add some beats to your cart!
            </p>
            <Button 
              onClick={() => window.location.href = '/'} 
              className="w-full"
            >
              Browse Beats
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Button variant="outline" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>
      
      {/* Wallet Auth Prompt */}
      <WalletAuthPrompt 
        isConnected={wallet.connected} 
        walletAddress={wallet.publicKey?.toString()}
      />
      
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cartItems.map((item) => (
            <CartItemCard
              key={`${item.beat_id}-${item.license_type}`}
              item={item}
              onRemove={removeFromCart}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                
                <PaymentHandler 
                  cartItems={cartItems}
                  totalPrice={totalPrice}
                  onPaymentSuccess={clearCart}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  return (
    <MainLayoutWithPlayer activeTab="cart">
      <WalletDependentWrapper>
        <CartContent />
      </WalletDependentWrapper>
    </MainLayoutWithPlayer>
  );
};

export default Cart;
