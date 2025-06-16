
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
    console.log('🛒 No user ID, returning empty cart');
    return [];
  }

  try {
    const cartKey = `cart_${userId}`;
    console.log('🛒 Loading cart synchronously from localStorage with key:', cartKey);
    
    const savedCart = localStorage.getItem(cartKey);
    console.log('🛒 Raw localStorage data (sync):', savedCart);
    
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      console.log('🛒 Parsed localStorage data (sync):', parsed);
      
      let lightweightItems: LightweightCartItem[] = [];
      
      // Check if it's already in lightweight format
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        
        // If it has beatId property, it's already lightweight format
        if (firstItem.beatId) {
          console.log('🛒 Data is already in lightweight format (sync)');
          lightweightItems = parsed.filter(item => 
            item && 
            typeof item.beatId === 'string' && 
            typeof item.licenseType === 'string' && 
            typeof item.addedAt === 'string'
          );
        }
        // If it has beat.id property, it's old CartContext format
        else if (firstItem.beat && firstItem.beat.id) {
          console.log('🛒 Converting from old CartContext format (sync)');
          lightweightItems = parsed.map((item: any) => ({
            beatId: item.beat?.id || item.beatId,
            licenseType: item.beat?.selected_license || item.licenseType || 'basic',
            addedAt: item.added_at || item.addedAt || new Date().toISOString()
          })).filter(item => item.beatId);
        }
        else {
          console.warn('🛒 Unknown cart data format (sync):', firstItem);
        }
      }
      
      console.log('🛒 Final lightweight items (sync):', lightweightItems);
      return lightweightItems;
    } else {
      console.log('🛒 No saved cart found (sync)');
      return [];
    }
  } catch (error) {
    console.error('🛒 Error loading lightweight cart (sync):', error);
    
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
    console.log('🛒 Initializing cart state synchronously...');
    return loadCartFromStorage(user?.id);
  });
  
  const [itemCount, setItemCount] = useState(() => {
    const initialCart = loadCartFromStorage(user?.id);
    console.log('🛒 Initial item count:', initialCart.length);
    return initialCart.length;
  });

  console.log('🛒 useCartLightweight hook initialized with user:', user ? { id: user.id, email: user.email } : 'No user');
  console.log('🛒 Initial cart state:', { cartItemsLength: cartItems.length, itemCount });

  // Update cart when user changes
  useEffect(() => {
    console.log('🛒 User changed, reloading cart...');
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Force refresh cart data from localStorage
  const refreshCartFromStorage = useCallback(() => {
    console.log('🛒 Force refreshing cart from localStorage');
    const newCartItems = loadCartFromStorage(user?.id);
    setCartItems(newCartItems);
    setItemCount(newCartItems.length);
  }, [user?.id]);

  // Save to localStorage when cart changes
  useEffect(() => {
    if (!user) return;
    
    try {
      const cartKey = `cart_${user.id}`;
      console.log('🛒 Saving cart to localStorage:', cartItems);
      localStorage.setItem(cartKey, JSON.stringify(cartItems));
      console.log('🛒 Cart saved successfully to key:', cartKey);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('cartUpdated', { 
        detail: { cartItems, itemCount: cartItems.length } 
      }));
      
      // Verify the save worked
      const verification = localStorage.getItem(cartKey);
      console.log('🛒 Verification - cart saved as:', verification);
    } catch (error) {
      console.error('🛒 Error saving lightweight cart:', error);
    }
  }, [cartItems, user]);

  // Add localStorage event listener to sync across tabs/components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!user) return;
      
      const cartKey = `cart_${user.id}`;
      if (e.key === cartKey && e.newValue) {
        console.log('🛒 localStorage changed externally, updating cart:', e.newValue);
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCartItems(parsed);
            setItemCount(parsed.length);
          }
        } catch (error) {
          console.error('🛒 Error parsing storage change:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Add custom event listener for cart updates
  useEffect(() => {
    const handleCartUpdate = (e: CustomEvent) => {
      console.log('🛒 Custom cart update event received:', e.detail);
      refreshCartFromStorage();
    };

    window.addEventListener('cartUpdated', handleCartUpdate as EventListener);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate as EventListener);
  }, [refreshCartFromStorage]);

  // Add window focus listener to refresh cart when returning to tab
  useEffect(() => {
    const handleFocus = () => {
      console.log('🛒 Window focused, refreshing cart...');
      refreshCartFromStorage();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshCartFromStorage]);

  const isInCart = useCallback((beatId: string): boolean => {
    const result = cartItems.some(item => item.beatId === beatId);
    console.log(`🛒 Checking if beat ${beatId} is in cart:`, result, 'Current cart items:', cartItems);
    return result;
  }, [cartItems]);

  const addToCart = useCallback((beatId: string, licenseType: string = 'basic') => {
    console.log(`🛒 addToCart called with beatId: ${beatId}, licenseType: ${licenseType}`);
    
    if (!user) {
      console.log('🛒 Cannot add to cart - no user');
      return;
    }

    console.log('🛒 Current cartItems before adding:', cartItems);
    console.log('🛒 User ID:', user.id);
    
    const existingIndex = cartItems.findIndex(item => item.beatId === beatId);
    console.log('🛒 Existing item index:', existingIndex);
    
    if (existingIndex >= 0) {
      console.log('🛒 Beat already in cart, updating license type');
      // Update license type if item exists
      const updatedItems = [...cartItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        licenseType
      };
      console.log('🛒 Updated items array:', updatedItems);
      setCartItems(updatedItems);
    } else {
      console.log('🛒 Adding new beat to cart');
      // Add new item
      const newItem: LightweightCartItem = {
        beatId,
        licenseType,
        addedAt: new Date().toISOString()
      };
      console.log('🛒 New item created:', newItem);
      
      const newItems = [...cartItems, newItem];
      console.log('🛒 New items array:', newItems);
      
      setCartItems(newItems);
      setItemCount(newItems.length);
      
      console.log('🛒 State updated - new cart items length:', newItems.length);
    }
  }, [cartItems, user]);

  const removeFromCart = useCallback((beatId: string) => {
    console.log(`🛒 Removing beat ${beatId} from cart`);
    console.log('🛒 Current cart items before removal:', cartItems);
    
    setCartItems(prev => {
      const filtered = prev.filter(item => item.beatId !== beatId);
      setItemCount(filtered.length);
      console.log('🛒 Cart after removal:', filtered);
      return filtered;
    });
  }, [cartItems]);

  const clearCart = useCallback(() => {
    console.log('🛒 Clearing entire cart');
    setCartItems([]);
    setItemCount(0);
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
    }
  }, [user]);

  console.log('🛒 useCartLightweight returning:', {
    cartItemsLength: cartItems.length,
    itemCount,
    userId: user?.id
  });

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
