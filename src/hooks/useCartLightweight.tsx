
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
      console.log('🛒 No user, clearing cart');
      setCartItems([]);
      setItemCount(0);
      return;
    }

    try {
      const cartKey = `cart_${user.id}`;
      console.log('🛒 Loading cart from localStorage with key:', cartKey);
      
      const savedCart = localStorage.getItem(cartKey);
      console.log('🛒 Raw localStorage data:', savedCart);
      
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        console.log('🛒 Parsed localStorage data:', parsed);
        
        let lightweightItems: LightweightCartItem[] = [];
        
        // Check if it's already in lightweight format
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0];
          
          // If it has beatId property, it's already lightweight format
          if (firstItem.beatId) {
            console.log('🛒 Data is already in lightweight format');
            lightweightItems = parsed.filter(item => 
              item && 
              typeof item.beatId === 'string' && 
              typeof item.licenseType === 'string' && 
              typeof item.addedAt === 'string'
            );
          }
          // If it has beat.id property, it's old CartContext format
          else if (firstItem.beat && firstItem.beat.id) {
            console.log('🛒 Converting from old CartContext format');
            lightweightItems = parsed.map((item: any) => ({
              beatId: item.beat?.id || item.beatId,
              licenseType: item.beat?.selected_license || item.licenseType || 'basic',
              addedAt: item.added_at || item.addedAt || new Date().toISOString()
            })).filter(item => item.beatId);
          }
          else {
            console.warn('🛒 Unknown cart data format:', firstItem);
          }
        }
        
        console.log('🛒 Final lightweight items:', lightweightItems);
        setCartItems(lightweightItems);
        setItemCount(lightweightItems.length);
      } else {
        console.log('🛒 No saved cart found');
        setCartItems([]);
        setItemCount(0);
      }
    } catch (error) {
      console.error('🛒 Error loading lightweight cart:', error);
      setCartItems([]);
      setItemCount(0);
      
      // Clear corrupted data
      if (user) {
        localStorage.removeItem(`cart_${user.id}`);
      }
    }
  }, [user]);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!user) return;
    
    try {
      const cartKey = `cart_${user.id}`;
      console.log('🛒 Saving cart to localStorage:', cartItems);
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      console.log('🛒 Cart saved successfully to key:', cartKey);
    } catch (error) {
      console.error('🛒 Error saving lightweight cart:', error);
    }
  }, [cartItems, user]);

  const isInCart = useCallback((beatId: string): boolean => {
    const result = cartItems.some(item => item.beatId === beatId);
    console.log(`🛒 Checking if beat ${beatId} is in cart:`, result);
    return result;
  }, [cartItems]);

  const addToCart = useCallback((beatId: string, licenseType: string = 'basic') => {
    if (!user) {
      console.log('🛒 Cannot add to cart - no user');
      return;
    }

    console.log(`🛒 Adding beat ${beatId} with license ${licenseType} to cart`);
    
    const existingIndex = cartItems.findIndex(item => item.beatId === beatId);
    
    if (existingIndex >= 0) {
      console.log('🛒 Beat already in cart, updating license type');
      // Update license type if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        licenseType
      };
      setCartItems(updatedItems);
    } else {
      console.log('🛒 Adding new beat to cart');
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
    console.log(`🛒 Removing beat ${beatId} from cart`);
    setCartItems(prev => {
      const filtered = prev.filter(item => item.beatId !== beatId);
      setItemCount(filtered.length);
      console.log('🛒 Cart after removal:', filtered);
      return filtered;
    });
  }, []);

  const clearCart = useCallback(() => {
    console.log('🛒 Clearing entire cart');
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
