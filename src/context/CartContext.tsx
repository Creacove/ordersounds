
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

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    if (user) {
      try {
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
      } catch (error) {
        console.error("Error accessing localStorage:", error);
        // Continue without cart data if localStorage fails
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
      
      const price = getLicensePrice(item.beat as any, licenseType, currency === 'USD');
      
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  useEffect(() => {
    if (user && cartItems.length > 0) {
      try {
        localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartItems));
      } catch (error) {
        console.error("Error saving cart to localStorage:", error);
        // Try to remove some items if storage is full
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          // If we have more than 5 items, reduce to 5 and try again
          if (cartItems.length > 5) {
            const reducedCart = cartItems.slice(0, 5);
            try {
              localStorage.setItem(`cart_${user.id}`, JSON.stringify(reducedCart));
              setCartItems(reducedCart);
              toast.warning("Cart was limited to 5 items due to storage constraints");
            } catch (innerError) {
              console.error("Still failed to save reduced cart:", innerError);
            }
          }
        }
      }
    } else if (user && cartItems.length === 0) {
      // Explicitly clear cart in localStorage when cartItems is empty
      try {
        localStorage.removeItem(`cart_${user.id}`);
      } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
      }
    }
  }, [cartItems, user]);

  const addToCart = (beat: Beat & { selected_license?: string }) => {
    if (!user) return;
    
    const existingItem = cartItems.find(item => item.beat.id === beat.id);
    const lightweightBeat = createLightweightBeat(beat);
    
    if (existingItem) {
      if (existingItem.beat.selected_license !== beat.selected_license) {
        setCartItems(prevItems => 
          prevItems.map(item => 
            item.beat.id === beat.id 
              ? { ...item, beat: { ...lightweightBeat } } 
              : item
          )
        );
      }
    } else {
      // Check if cart is getting too large
      if (cartItems.length >= 20) {
        toast.warning("Maximum cart size reached (20 items)");
        return;
      }
      
      setCartItems(prevItems => [
        ...prevItems, 
        { 
          beat: lightweightBeat,
          added_at: new Date().toISOString() 
        }
      ]);
    }
  };

  const addMultipleToCart = (beats: Beat[]) => {
    if (!user) return;
    
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
      setCartItems(prevItems => [...prevItems, ...newItems]);
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
      try {
        if (updatedItems.length === 0) {
          localStorage.removeItem(`cart_${user.id}`);
        } else {
          localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedItems));
        }
      } catch (error) {
        console.error("Error updating cart in localStorage after removal:", error);
      }
    }
  };

  const clearCart = () => {
    // Log for debugging
    console.log("Clearing cart");
    
    setCartItems([]);
    
    // Clear from localStorage
    if (user) {
      try {
        localStorage.removeItem(`cart_${user.id}`);
      } catch (error) {
        console.error("Error clearing cart from localStorage:", error);
      }
    }
  };

  const isInCart = (beatId: string) => {
    return cartItems.some(item => item.beat.id === beatId);
  };

  const getCartItemCount = () => {
    return cartItems.length;
  };

  const refreshCart = async () => {
    if (cartItems.length === 0) return;
    
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
        
        setCartItems(cartWithUpdatedWallets);
        
        if (user) {
          try {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(cartWithUpdatedWallets));
          } catch (error) {
            console.error("Error saving updated cart to localStorage:", error);
          }
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
        
        setCartItems(updatedCartItems);
        
        if (user) {
          try {
            localStorage.setItem(`cart_${user.id}`, JSON.stringify(updatedCartItems));
          } catch (error) {
            console.error("Error saving updated cart to localStorage:", error);
          }
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
      removeFromCart(beat.id);
      toast.success('Removed from cart');
    } else {
      const beatWithLicense = {
        ...beat,
        selected_license: licenseType
      };
      addToCart(beatWithLicense);
      toast.success('Added to cart');
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
