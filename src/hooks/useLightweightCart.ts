
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Simple cart state stored in localStorage for performance
interface LightweightCartItem {
  beatId: string;
  licenseType: string;
  addedAt: string;
}

const CART_STORAGE_KEY = 'lightweight_cart';
const CART_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export function useLightweightCart() {
  const [cartItems, setCartItems] = useState<LightweightCartItem[]>([]);
  const [itemCount, setItemCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const { items, timestamp } = JSON.parse(stored);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - timestamp < CART_CACHE_EXPIRY) {
          setCartItems(items);
          setItemCount(items.length);
        } else {
          // Cache expired, clear it
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading lightweight cart:', error);
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, []);

  // Save cart to localStorage
  const saveToStorage = useCallback((items: LightweightCartItem[]) => {
    try {
      const cartData = {
        items,
        timestamp: Date.now()
      };
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Error saving lightweight cart:', error);
    }
  }, []);

  // Check if beat is in cart
  const isInCart = useCallback((beatId: string): boolean => {
    return cartItems.some(item => item.beatId === beatId);
  }, [cartItems]);

  // Add beat to lightweight cart
  const addToLightweightCart = useCallback((beatId: string, licenseType: string = 'basic') => {
    const newItem: LightweightCartItem = {
      beatId,
      licenseType,
      addedAt: new Date().toISOString()
    };

    const updatedItems = cartItems.filter(item => item.beatId !== beatId);
    updatedItems.push(newItem);
    
    setCartItems(updatedItems);
    setItemCount(updatedItems.length);
    saveToStorage(updatedItems);
    
    toast.success('Added to cart');
  }, [cartItems, saveToStorage]);

  // Remove beat from lightweight cart
  const removeFromLightweightCart = useCallback((beatId: string) => {
    const updatedItems = cartItems.filter(item => item.beatId !== beatId);
    
    setCartItems(updatedItems);
    setItemCount(updatedItems.length);
    saveToStorage(updatedItems);
    
    toast.success('Removed from cart');
  }, [cartItems, saveToStorage]);

  // Toggle beat in cart
  const toggleCartItem = useCallback((beatId: string, licenseType: string = 'basic') => {
    if (isInCart(beatId)) {
      removeFromLightweightCart(beatId);
    } else {
      addToLightweightCart(beatId, licenseType);
    }
  }, [isInCart, addToLightweightCart, removeFromLightweightCart]);

  // Clear lightweight cart
  const clearLightweightCart = useCallback(() => {
    setCartItems([]);
    setItemCount(0);
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Sync lightweight cart with full cart (when needed)
  const syncWithFullCart = useCallback((fullCartItems: any[]) => {
    const lightweightItems: LightweightCartItem[] = fullCartItems.map(item => ({
      beatId: item.beat_id,
      licenseType: item.license_type,
      addedAt: item.added_at
    }));
    
    setCartItems(lightweightItems);
    setItemCount(lightweightItems.length);
    saveToStorage(lightweightItems);
  }, [saveToStorage]);

  return {
    cartItems,
    itemCount,
    isInCart,
    addToLightweightCart,
    removeFromLightweightCart,
    toggleCartItem,
    clearLightweightCart,
    syncWithFullCart
  };
}
