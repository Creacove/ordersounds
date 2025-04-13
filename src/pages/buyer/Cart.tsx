
import { useEffect } from "react";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useBeats } from "@/hooks/useBeats";

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();
  const navigate = useNavigate();
  const { fetchPurchasedBeats } = useBeats();

  useEffect(() => {
    document.title = "Your Cart | OrderSOUNDS";
  }, []);

  // Handle checkout process
  const handleCheckout = async () => {
    try {
      // This is a mock of checkout process
      toast.success("Purchase successful!");
      
      // Update purchased beats
      await fetchPurchasedBeats();
      
      // Clear cart
      clearCart();
      
      // Redirect to library
      navigate('/library', { 
        state: { 
          fromPurchase: true, 
          activeTab: "purchased" 
        } 
      });
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to complete checkout');
    }
  };

  // Handle purchase completion
  const handlePurchaseComplete = async (success: boolean) => {
    if (success) {
      try {
        // Update purchased beats collection
        await fetchPurchasedBeats();
        
        // Clear the cart
        clearCart();
        
        // Show success message
        toast.success('Purchase completed successfully!');
        
        // Redirect to library
        navigate('/library', { 
          state: { 
            fromPurchase: true,
            activeTab: "purchased" 
          }
        });
      } catch (error) {
        console.error('Error handling purchase completion:', error);
        toast.error('Error finalizing purchase');
      }
    }
  };

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>
        
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground mb-4">Your cart is empty</p>
            <button 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              onClick={() => navigate('/')}
            >
              Browse Beats
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.beat.id} className="flex gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.beat.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.beat.producer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.beat.basic_license_price_diaspora}</p>
                    <button 
                      className="text-sm text-red-500 hover:text-red-700"
                      onClick={() => removeFromCart(item.beat.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border rounded-lg p-4">
              <h3 className="font-medium border-b pb-2 mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span>Items ({cart.length}):</span>
                  <span>${cart.reduce((sum, item) => sum + item.beat.basic_license_price_diaspora, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-medium pt-2 border-t">
                  <span>Total:</span>
                  <span>${cart.reduce((sum, item) => sum + item.beat.basic_license_price_diaspora, 0).toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                onClick={handleCheckout}
              >
                Checkout
              </button>
              <button 
                className="w-full mt-2 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md"
                onClick={() => clearCart()}
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
