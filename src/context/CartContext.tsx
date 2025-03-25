
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Beat } from '@/types';
import { useAuth } from './AuthContext';

interface CartItem {
  beat: Beat & { selected_license?: string };
  added_at: string;
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (beat: Beat & { selected_license?: string }) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  totalAmount: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
  getCartItemCount: () => 0
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);

  // Load cart from local storage on mount
  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (error) {
          console.error("Error loading cart from local storage:", error);
          setCartItems([]);
        }
      }
    } else {
      setCartItems([]);
    }
  }, [user]);

  // Calculate total whenever cart or currency changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setTotalAmount(0);
      return;
    }

    const newTotal = cartItems.reduce((total, item) => {
      // Get price based on license type
      let price = 0;
      if (currency === 'NGN') {
        if (item.beat.selected_license === 'basic') {
          price = item.beat.basic_license_price_local || item.beat.price_local * 0.5;
        } else if (item.beat.selected_license === 'premium') {
          price = item.beat.premium_license_price_local || item.beat.price_local;
        } else if (item.beat.selected_license === 'exclusive') {
          price = item.beat.exclusive_license_price_local || item.beat.price_local * 3;
        } else {
          price = item.beat.price_local;
        }
      } else {
        if (item.beat.selected_license === 'basic') {
          price = item.beat.basic_license_price_diaspora || item.beat.price_diaspora * 0.5;
        } else if (item.beat.selected_license === 'premium') {
          price = item.beat.premium_license_price_diaspora || item.beat.price_diaspora;
        } else if (item.beat.selected_license === 'exclusive') {
          price = item.beat.exclusive_license_price_diaspora || item.beat.price_diaspora * 3;
        } else {
          price = item.beat.price_diaspora;
        }
      }
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (beat: Beat & { selected_license?: string }) => {
    if (!user) return;
    
    // Check if beat is already in cart
    const existingItem = cartItems.find(item => item.beat.id === beat.id);
    
    if (existingItem) {
      // If the beat is already in the cart but with a different license,
      // update the license
      if (existingItem.beat.selected_license !== beat.selected_license) {
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.beat.id === beat.id 
              ? { ...item, beat: { ...beat } } 
              : item
          )
        );
      }
    } else {
      // Add new item to cart
      setCartItems(prevItems => [
        ...prevItems, 
        { 
          beat: { ...beat },
          added_at: new Date().toISOString() 
        }
      ]);
    }
  };

  const removeFromCart = (beatId: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.beat.id !== beatId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const isInCart = (beatId: string) => {
    return cartItems.some(item => item.beat.id === beatId);
  };

  const getCartItemCount = () => {
    return cartItems.length;
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      totalAmount,
      addToCart, 
      removeFromCart, 
      clearCart,
      isInCart,
      getCartItemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
