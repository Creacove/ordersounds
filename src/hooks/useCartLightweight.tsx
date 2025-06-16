
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface LightweightCartItem {
  beatId: string;
  licenseType: string;
  addedAt: string;
}

// Helper function to load cart from localStorage synchronously
const loadCartFromStorage = (userId: string | undefined): LightweightCartItem[] => {
  if (!userId) {
    return [];
  }

  try {
    const cartKey = `cart_${userId}`;
    const savedCart = localStorage.getItem(cartKey);
    
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      let lightweightItems: LightweightCartItem[] = [];
      
      // Check if it's already in lightweight format
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        
        // If it has beatId property, it's already lightweight format
        if (firstItem.beatId) {
          lightweightItems = parsed.filter(item => 
            item && 
            typeof item.beatId === 'string' && 
            typeof item.licenseType === 'string' && 
            typeof item.addedAt === 'string'
          );
        }
        // If it has beat.id property, it's old CartContext format
        else if (firstItem.beat && firstItem.beat.id) {
          lightweightItems = parsed.map((item: any) => ({
            beatId: item.beat?.id || item.beatId,
            licenseType: item.beat?.selected_license || item.licenseType || 'basic',
            addedAt: item.added_at || item.addedAt || new Date().toISOString()
          })).filter(item => item.beatId);
        }
      }
      
      return lightweightItems;
    } else {
      return [];
    }
  } catch (error) {
    // Clear corrupted data
    if (userId) {
      localStorage.removeItem(`cart_${userId}`);
    }
    return [];
  }
};

export function useCartLightweight() {
  const { user } = useAuth();
  
  // Initialize with data from localStorage synchronously
  const [cartItems, setCartItems] = useState<LightweightCartItem[]>(() => {
    return loadCartFromStorage(user?.id);
  });
  
  const [itemCount, setItemCount] = useState(() => {
    const initialCart = loadCartFromStorage(user?.id);
    return initialCart.length;
  });

  // Update cart when user changes
  useEffect(() => {
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Force refresh cart data from localStorage
  const refreshCartFromStorage = useCallback(() => {
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!user) return;
    
    try {
      const cartKey = `cart_${user.id}`;
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { cartItems, itemCount: cartItems.length } 
      }));
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  }, [cartItems, user]);

  // Add localStorage event listener to sync across tabs/components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;
      
      const cartKey = `cart_${user.id}`;
      if (e.key === cartKey && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
            setItemCount(parsed.length);
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const isInCart = useCallback((beatId: string): boolean => {
    return cartItems.some(item => item.beatId === beatId);
  }, [cartItems]);

  const addToCart = useCallback((beatId: string, licenseType: string = 'basic') => {
    if (!user) {
      return;
    }
    
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
      
      const newItems = [...cartItems, newItem];
      setCartItems(newItems);
      setItemCount(newItems.length);
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
    clearCart,
    refreshCartFromStorage
  };
}
