import React, { createContext, useContext, useState, useEffect } from 'react';
import { Beat } from '@/types';
import { useAuth } from './AuthContext';
import { getLicensePrice } from '@/utils/licenseUtils';

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
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  totalAmount: 0,
  addToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
  getCartItemCount: () => 0,
  itemCount: 0
});

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (user) {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
          setItemCount(parsedCart.length);
        } catch (error) {
          console.error("Error loading cart from local storage:", error);
          setCartItems([]);
          setItemCount(0);
        }
      } else {
        setCartItems([]);
        setItemCount(0);
      }
    } else {
      setCartItems([]);
      setItemCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (cartItems.length === 0) {
      setTotalAmount(0);
      setItemCount(0);
      return;
    }

    setItemCount(cartItems.length);

    const newTotal = cartItems.reduce((total, item) => {
      const licenseType = item.beat.selected_license || 'basic';
      
      // Always use the getLicensePrice function for consistency
      const price = getLicensePrice(item.beat, licenseType, currency === 'USD');
      
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  const addToCart = (beat: Beat & { selected_license?: string }) => {
    if (!user) return;
    
    const existingItem = cartItems.find(item => item.beat.id === beat.id);
    
    if (existingItem) {
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
      getCartItemCount,
      itemCount
    }}>
      {children}
    </CartContext.Provider>
  );
};
