
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Beat } from '@/types';
import { useAuth } from './AuthContext';
import { getLicensePrice } from '@/utils/licenseUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define a lightweight version of the Beat type for storage
type LightweightBeat = {
  id: string;
  title: string;
  producer_id: string;
  producer_name: string;
  cover_image_url: string;
  basic_license_price_local: number;
  basic_license_price_diaspora: number;
  premium_license_price_local?: number;
  premium_license_price_diaspora?: number;
  exclusive_license_price_local?: number;
  exclusive_license_price_diaspora?: number;
  selected_license?: string;
  genre?: string;
  producer_wallet_address?: string; // Added this property for Solana payments
};

interface CartItem {
  beat: LightweightBeat;
  added_at: string;
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (beat: Beat & { selected_license?: string }) => void;
  addMultipleToCart: (beats: Beat[]) => void;
  removeFromCart: (beatId: string) => void;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  getCartItemCount: () => number;
  itemCount: number;
  refreshCart: () => Promise<void>;
  toggleCartItem: (beat: Beat, licenseType: string) => void;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  totalAmount: 0,
  addToCart: () => {},
  addMultipleToCart: () => {},
  removeFromCart: () => {},
  clearCart: () => {},
  isInCart: () => false,
  getCartItemCount: () => 0,
  itemCount: 0,
  refreshCart: async () => {},
  toggleCartItem: () => {}
});

export const useCart = () => useContext(CartContext);

// Function to create a lightweight version of a beat for storage
const createLightweightBeat = (beat: Beat & { selected_license?: string }): LightweightBeat => {
  // Get the wallet address from producer object first (if available), then from users object
  const walletAddress = 
    beat.producer?.wallet_address || 
    beat.users?.wallet_address || 
    undefined;
    
  if (!walletAddress) {
    console.log(`No wallet address found for beat: ${beat.id}, producer: ${beat.producer_id}`);
  }

  return {
    id: beat.id,
    title: beat.title,
    producer_id: beat.producer_id,
    producer_name: beat.producer_name,
    cover_image_url: beat.cover_image_url,
    basic_license_price_local: beat.basic_license_price_local || 0,
    basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
    premium_license_price_local: beat.premium_license_price_local,
    premium_license_price_diaspora: beat.premium_license_price_diaspora,
    exclusive_license_price_local: beat.exclusive_license_price_local,
    exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
    selected_license: beat.selected_license || 'basic',
    genre: beat.genre,
    producer_wallet_address: walletAddress
  };
};

// Helper to safely save to localStorage
const safeLocalStorageSave = (key: string, value: any) => {
  try {
    const stringValue = JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
};

// Helper to safely get from localStorage
const safeLocalStorageGet = (key: string) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return null;
  }
};

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  // Load cart from localStorage when user changes
  useEffect(() => {
    if (user) {
      const savedCart = safeLocalStorageGet(`cart_${user.id}`);
      if (savedCart && Array.isArray(savedCart)) {
        console.log("Loading cart from localStorage:", savedCart);
        setCartItems(savedCart);
        setItemCount(savedCart.length);
      } else {
        console.log("No valid cart found in localStorage, initializing empty cart");
        setCartItems([]);
        setItemCount(0);
      }
    } else {
      console.log("No user, clearing cart");
      setCartItems([]);
      setItemCount(0);
    }
  }, [user]);

  // Calculate total amount when cart or currency changes
  useEffect(() => {
    if (cartItems.length === 0) {
      setTotalAmount(0);
      setItemCount(0);
      return;
    }

    setItemCount(cartItems.length);

    const newTotal = cartItems.reduce((total, item) => {
      const licenseType = item.beat.selected_license || 'basic';
      const price = getLicensePrice(item.beat as any, licenseType, currency === 'USD');
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  // Save cart to localStorage when it changes
  useEffect(() => {
    if (user) {
      if (cartItems.length > 0) {
        console.log("Saving cart to localStorage:", cartItems);
        const success = safeLocalStorageSave(`cart_${user.id}`, cartItems);
        
        if (!success && cartItems.length > 5) {
          // If storage fails, try with a reduced cart
          const reducedCart = cartItems.slice(0, 5);
          safeLocalStorageSave(`cart_${user.id}`, reducedCart);
          setCartItems(reducedCart);
          toast.warning("Cart was limited to 5 items due to storage constraints");
        }
      } else {
        // Clear cart in localStorage when cart is empty
        localStorage.removeItem(`cart_${user.id}`);
      }
    }
  }, [cartItems, user]);

  const addToCart = (beat: Beat & { selected_license?: string }) => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    
    console.log("Adding to cart:", beat.id, beat.title);
    const existingItem = cartItems.find(item => item.beat.id === beat.id);
    const lightweightBeat = createLightweightBeat(beat);
    
    if (existingItem) {
      if (existingItem.beat.selected_license !== beat.selected_license) {
        // Update existing item with new license
        const updatedItems = cartItems.map(item => 
          item.beat.id === beat.id 
            ? { ...item, beat: { ...lightweightBeat } } 
            : item
        );
        setCartItems(updatedItems);
        console.log("Updated item in cart:", beat.id, updatedItems);
      } else {
        console.log("Item already in cart with same license:", beat.id);
      }
    } else {
      // Check if cart is getting too large
      if (cartItems.length >= 20) {
        toast.warning("Maximum cart size reached (20 items)");
        return;
      }
      
      // Add new item to cart
      const newItem = { 
        beat: lightweightBeat,
        added_at: new Date().toISOString() 
      };
      
      const newCartItems = [...cartItems, newItem];
      console.log("Added new item to cart:", beat.id, newCartItems);
      setCartItems(newCartItems);
      toast.success("Added to cart");
    }
  };

  const addMultipleToCart = (beats: Beat[]) => {
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    
    const now = new Date().toISOString();
    const newItems: CartItem[] = [];
    
    // Limit to prevent storage issues
    const availableSlots = Math.max(0, 20 - cartItems.length);
    
    beats.slice(0, availableSlots).forEach(beat => {
      if (!cartItems.some(item => item.beat.id === beat.id)) {
        newItems.push({
          beat: createLightweightBeat({...beat, selected_license: 'basic'}),
          added_at: now
        });
      }
    });
    
    if (newItems.length > 0) {
      const updatedCart = [...cartItems, ...newItems];
      console.log("Added multiple items to cart:", updatedCart);
      setCartItems(updatedCart);
      toast.success(`Added ${newItems.length} beat${newItems.length > 1 ? 's' : ''} to cart`);
    } else if (beats.length > availableSlots) {
      toast.info('Cart limit reached. Some beats could not be added.');
    } else {
      toast.info('All selected beats are already in your cart');
    }
  };

  const removeFromCart = (beatId: string) => {
    // Log for debugging
    console.log("Removing beat from cart:", beatId);
    console.log("Current cart before removal:", cartItems);
    
    const updatedItems = cartItems.filter(item => item.beat.id !== beatId);
    
    // Log updated cart
    console.log("Updated cart after removal:", updatedItems);
    
    setCartItems(updatedItems);
    
    // Update localStorage immediately
    if (user) {
      if (updatedItems.length === 0) {
        localStorage.removeItem(`cart_${user.id}`);
      } else {
        safeLocalStorageSave(`cart_${user.id}`, updatedItems);
      }
    }
    
    return true; // Return success indicator
  };

  const clearCart = () => {
    // Log for debugging
    console.log("Clearing cart");
    
    setCartItems([]);
    
    // Clear from localStorage
    if (user) {
      localStorage.removeItem(`cart_${user.id}`);
      console.log("Cart cleared from localStorage");
    }
  };

  const isInCart = (beatId: string) => {
    return cartItems.some(item => item.beat.id === beatId);
  };

  const getCartItemCount = () => {
    return cartItems.length;
  };

  const refreshCart = async () => {
    if (!user) return;
    if (cartItems.length === 0) return;
    
    console.log("Refreshing cart...");
    
    const beatIds = cartItems.map(item => item.beat.id);
    const producerIds = cartItems.map(item => item.beat.producer_id);
    
    try {
      // Verify beats still exist
      const { data: existingBeats, error } = await supabase
        .from('beats')
        .select('id')
        .in('id', beatIds);
        
      if (error) {
        console.error('Error refreshing cart:', error);
        toast.error('Failed to refresh cart. Please try again.');
        return;
      }
      
      // Fetch current producer wallet addresses
      const { data: producerData, error: producerError } = await supabase
        .from('users')
        .select('id, wallet_address')
        .in('id', producerIds);
        
      if (producerError) {
        console.error('Error fetching producer data:', producerError);
      }
      
      // Create wallet address map
      const walletAddressMap: { [key: string]: string | null } = {};
      if (producerData) {
        producerData.forEach(producer => {
          walletAddressMap[producer.id] = producer.wallet_address;
        });
      }
      
      console.log("Producer wallet addresses:", walletAddressMap);
      
      if (existingBeats && existingBeats.length !== beatIds.length) {
        // Some beats no longer exist
        const existingIds = existingBeats.map(beat => beat.id);
        const updatedCart = cartItems.filter(item => existingIds.includes(item.beat.id));
        
        // Update wallet addresses in cart items
        const cartWithUpdatedWallets = updatedCart.map(item => ({
          ...item,
          beat: {
            ...item.beat,
            producer_wallet_address: walletAddressMap[item.beat.producer_id] || item.beat.producer_wallet_address
          }
        }));
        
        console.log("Updated cart after refresh:", cartWithUpdatedWallets);
        setCartItems(cartWithUpdatedWallets);
        
        if (user) {
          safeLocalStorageSave(`cart_${user.id}`, cartWithUpdatedWallets);
        }
        
        const removedCount = cartItems.length - updatedCart.length;
        if (removedCount > 0) {
          toast.info(`Removed ${removedCount} unavailable item${removedCount !== 1 ? 's' : ''} from your cart.`);
        }
      } else if (producerData) {
        // Just update wallet addresses if all beats still exist
        const updatedCartItems = cartItems.map(item => ({
          ...item,
          beat: {
            ...item.beat,
            producer_wallet_address: walletAddressMap[item.beat.producer_id] || item.beat.producer_wallet_address
          }
        }));
        
        console.log("Updated wallet addresses in cart:", updatedCartItems);
        setCartItems(updatedCartItems);
        
        if (user) {
          safeLocalStorageSave(`cart_${user.id}`, updatedCartItems);
        }
      }
    } catch (err) {
      console.error('Error during cart refresh:', err);
    }
  };

  const toggleCartItem = (beat: Beat, licenseType: string) => {
    if (!user) {
      toast.error('Please log in to add items to cart');
      return;
    }
    
    const isBeatingCart = isInCart(beat.id);
    
    if (isBeatingCart) {
      if (removeFromCart(beat.id)) {
        toast.success('Removed from cart');
      }
    } else {
      const beatWithLicense = {
        ...beat,
        selected_license: licenseType
      };
      addToCart(beatWithLicense);
    }
  };

  const contextValue = {
    cartItems,
    addToCart,
    addMultipleToCart,
    removeFromCart,
    clearCart,
    totalAmount,
    refreshCart,
    isInCart,
    getCartItemCount,
    itemCount,
    toggleCartItem
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};
