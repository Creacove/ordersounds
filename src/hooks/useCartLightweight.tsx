
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LightweightCartItem {
  beatId: string;
  licenseType: string;
  addedAt: string;
}

export function useCartLightweight() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<LightweightCartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);

  // Load cart from localStorage immediately (no async operations)
  useEffect(() => {
    if (!user) {
      setCartItems([]);
      setItemCount(0);
      return;
    }

    try {
      const savedCart = localStorage.getItem(`cart_${user.id}`);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        // Convert from old format to lightweight format if needed
        const lightweightItems: LightweightCartItem[] = parsed.map((item: any) => ({
          beatId: item.beat?.id || item.beatId,
          licenseType: item.beat?.selected_license || item.licenseType || 'basic',
          addedAt: item.added_at || item.addedAt || new Date().toISOString()
        }));
        setCartItems(lightweightItems);
        setItemCount(lightweightItems.length);
      }
    } catch (error) {
      console.error('Error loading lightweight cart:', error);
      setCartItems([]);
      setItemCount(0);
    }
  }, [user]);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!user) return;
    
    try {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving lightweight cart:', error);
    }
  }, [cartItems, user]);

  const isInCart = useCallback((beatId: string): boolean => {
    return cartItems.some(item => item.beatId === beatId);
  }, [cartItems]);

  const addToCart = useCallback((beatId: string, licenseType: string = 'basic') => {
    if (!user) return;

    const existingIndex = cartItems.findIndex(item => item.beatId === beatId);
    
    if (existingIndex >= 0) {
      // Update license type if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        licenseType
      };
      setCartItems(updatedItems);
    } else {
      // Add new item
      const newItem: LightweightCartItem = {
        beatId,
        licenseType,
        addedAt: new Date().toISOString()
      };
      setCartItems(prev => [...prev, newItem]);
      setItemCount(prev => prev + 1);
    }
  }, [cartItems, user]);

  const removeFromCart = useCallback((beatId: string) => {
    setCartItems(prev => {
      const filtered = prev.filter(item => item.beatId !== beatId);
      setItemCount(filtered.length);
      return filtered;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setItemCount(0);
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
  }, [user]);

  return {
    cartItems,
    itemCount,
    isInCart,
    addToCart,
    removeFromCart,
    clearCart
  };
}
