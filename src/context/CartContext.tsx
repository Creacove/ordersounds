
import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Beat, CartItem } from '@/types';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (beat: Beat) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  totalAmount: number;
  itemCount: number;
  isInCart: (beatId: string) => boolean; // Add the isInCart method
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { currency, user } = useAuth();

  useEffect(() => {
    // Load cart from localStorage when user changes
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          console.error('Failed to parse cart', e);
          setCartItems([]);
        }
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  useEffect(() => {
    // Save cart to localStorage when it changes
    if (user && cartItems.length > 0) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (beat: Beat) => {
    // Check if beat already exists in cart
    if (cartItems.some(item => item.beat.id === beat.id)) {
      toast.info('This beat is already in your cart');
      return;
    }

    const newItem: CartItem = {
      beat,
      added_at: new Date().toISOString(),
    };

    setCartItems(prev => [...prev, newItem]);
    toast.success('Added to cart');
  };

  const removeFromCart = (beatId: string) => {
    setCartItems(prev => prev.filter(item => item.beat.id !== beatId));
    toast.success('Removed from cart');
  };

  const clearCart = () => {
    setCartItems([]);
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
  };

  // Add the isInCart method implementation
  const isInCart = (beatId: string): boolean => {
    return cartItems.some(item => item.beat.id === beatId);
  };

  // Calculate total based on selected currency
  const totalAmount = cartItems.reduce((sum, item) => {
    const price = currency === 'NGN' ? item.beat.price_local : item.beat.price_diaspora;
    return sum + price;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalAmount,
        itemCount: cartItems.length,
        isInCart, // Add the isInCart method to the context value
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
