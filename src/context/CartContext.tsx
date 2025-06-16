
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from './AuthContext';
import { getLicensePrice } from '@/utils/licenseUtils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define cart item type based on database structure
interface CartItem {
  id: string;
  beat_id: string;
  license_type: string;
  quantity: number;
  added_at: string;
  beat?: {
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
    genre?: string;
    producer_wallet_address?: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  totalAmount: number;
  addToCart: (beat: Beat & { selected_license?: string }) => Promise<void>;
  addMultipleToCart: (beats: Beat[]) => void;
  removeFromCart: (beatId: string) => Promise<boolean>;
  clearCart: () => void;
  isInCart: (beatId: string) => boolean;
  getCartItemCount: () => number;
  itemCount: number;
  refreshCart: () => Promise<void>;
  toggleCartItem: (beat: Beat, licenseType: string) => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cartItems: [],
  totalAmount: 0,
  addToCart: async () => {},
  addMultipleToCart: () => {},
  removeFromCart: async () => false,
  clearCart: () => {},
  isInCart: () => false,
  getCartItemCount: () => 0,
  itemCount: 0,
  refreshCart: async () => {},
  toggleCartItem: async () => {}
});

export const useCart = () => useContext(CartContext);

// Generate session ID for guests
const getSessionId = () => {
  let sessionId = localStorage.getItem('guest_session_id');
  if (!sessionId) {
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest_session_id', sessionId);
  }
  return sessionId;
};

export const CartProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { user, currency } = useAuth();
  const [totalAmount, setTotalAmount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [cartId, setCartId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get or create cart
  const getOrCreateCart = async () => {
    try {
      if (user) {
        // For authenticated users
        let { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!existingCart) {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ user_id: user.id })
            .select('id')
            .single();

          if (error) throw error;
          existingCart = newCart;
        }

        return existingCart.id;
      } else {
        // For guest users
        const sessionId = getSessionId();
        let { data: existingCart } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (!existingCart) {
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ session_id: sessionId })
            .select('id')
            .single();

          if (error) throw error;
          existingCart = newCart;
        }

        return existingCart.id;
      }
    } catch (error) {
      console.error('Error getting/creating cart:', error);
      return null;
    }
  };

  // Load cart items from database
  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const currentCartId = await getOrCreateCart();
      if (!currentCartId) return;

      setCartId(currentCartId);

      const { data: items, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          beat_id,
          license_type,
          quantity,
          added_at,
          beats!inner(
            id,
            title,
            cover_image,
            basic_license_price_local,
            basic_license_price_diaspora,
            premium_license_price_local,
            premium_license_price_diaspora,
            exclusive_license_price_local,
            exclusive_license_price_diaspora,
            genre,
            producer_id,
            users!beats_producer_id_fkey(
              stage_name,
              wallet_address
            )
          )
        `)
        .eq('cart_id', currentCartId)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Error loading cart items:', error);
        return;
      }

      const formattedItems: CartItem[] = items?.map(item => ({
        id: item.id,
        beat_id: item.beat_id,
        license_type: item.license_type,
        quantity: item.quantity,
        added_at: item.added_at,
        beat: {
          id: item.beats.id,
          title: item.beats.title,
          producer_id: item.beats.producer_id,
          producer_name: item.beats.users?.stage_name || 'Unknown Producer',
          cover_image_url: item.beats.cover_image || '',
          basic_license_price_local: item.beats.basic_license_price_local || 0,
          basic_license_price_diaspora: item.beats.basic_license_price_diaspora || 0,
          premium_license_price_local: item.beats.premium_license_price_local,
          premium_license_price_diaspora: item.beats.premium_license_price_diaspora,
          exclusive_license_price_local: item.beats.exclusive_license_price_local,
          exclusive_license_price_diaspora: item.beats.exclusive_license_price_diaspora,
          genre: item.beats.genre,
          producer_wallet_address: item.beats.users?.wallet_address
        }
      })) || [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load cart on component mount and user change
  useEffect(() => {
    loadCartItems();
  }, [user]);

  // Calculate total amount and item count
  useEffect(() => {
    if (cartItems.length === 0) {
      setTotalAmount(0);
      setItemCount(0);
      return;
    }

    setItemCount(cartItems.length);

    const newTotal = cartItems.reduce((total, item) => {
      if (!item.beat) return total;
      const price = getLicensePrice(item.beat as any, item.license_type, currency === 'USD');
      return total + price;
    }, 0);

    setTotalAmount(newTotal);
  }, [cartItems, currency]);

  // Set up real-time subscription for cart updates
  useEffect(() => {
    if (!cartId) return;

    const channel = supabase
      .channel(`cart_${cartId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `cart_id=eq.${cartId}`
        },
        () => {
          // Reload cart items when changes occur
          loadCartItems();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [cartId]);

  const addToCart = async (beat: Beat & { selected_license?: string }) => {
    try {
      const currentCartId = cartId || await getOrCreateCart();
      if (!currentCartId) {
        toast.error('Failed to create cart');
        return;
      }

      const licenseType = beat.selected_license || 'basic';

      // Check if item already exists
      const existingItem = cartItems.find(item => item.beat_id === beat.id);

      if (existingItem) {
        // Update existing item
        const { error } = await supabase
          .from('cart_items')
          .update({ license_type: licenseType })
          .eq('id', existingItem.id);

        if (error) throw error;
        toast.success('Cart updated');
      } else {
        // Add new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: currentCartId,
            beat_id: beat.id,
            license_type: licenseType,
            quantity: 1
          });

        if (error) throw error;
        toast.success('Added to cart');
      }

      // Reload cart items
      await loadCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add item to cart');
    }
  };

  const addMultipleToCart = useCallback(async (beats: Beat[]) => {
    try {
      const currentCartId = cartId || await getOrCreateCart();
      if (!currentCartId) {
        toast.error('Failed to create cart');
        return;
      }

      // Filter out beats already in cart
      const newBeats = beats.filter(beat => 
        !cartItems.some(item => item.beat_id === beat.id)
      );

      if (newBeats.length === 0) {
        toast.info('All selected beats are already in your cart');
        return;
      }

      // Prepare cart items for insertion
      const cartItemsToInsert = newBeats.map(beat => ({
        cart_id: currentCartId,
        beat_id: beat.id,
        license_type: 'basic',
        quantity: 1
      }));

      const { error } = await supabase
        .from('cart_items')
        .insert(cartItemsToInsert);

      if (error) throw error;

      toast.success(`Added ${newBeats.length} beat${newBeats.length > 1 ? 's' : ''} to cart`);
      await loadCartItems();
    } catch (error) {
      console.error('Error adding multiple to cart:', error);
      toast.error('Failed to add items to cart');
    }
  }, [cartItems, cartId]);

  const removeFromCart = async (beatId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('beat_id', beatId)
        .eq('cart_id', cartId);

      if (error) throw error;

      await loadCartItems();
      return true;
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      return false;
    }
  };

  const clearCart = useCallback(async () => {
    try {
      if (!cartId) return;

      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;

      setCartItems([]);
      setItemCount(0);
      setTotalAmount(0);
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  }, [cartId]);

  const isInCart = useCallback((beatId: string): boolean => {
    return cartItems.some(item => item.beat_id === beatId);
  }, [cartItems]);

  const getCartItemCount = useCallback((): number => {
    return cartItems.length;
  }, [cartItems]);

  const refreshCart = async () => {
    await loadCartItems();
  };

  const toggleCartItem = async (beat: Beat, licenseType: string) => {
    const isItemInCart = isInCart(beat.id);
    
    try {
      if (isItemInCart) {
        await removeFromCart(beat.id);
      } else {
        const beatWithLicense = {
          ...beat,
          selected_license: licenseType
        };
        await addToCart(beatWithLicense);
      }
    } catch (error) {
      console.error("Error toggling cart item:", error);
      toast.error("Failed to update cart");
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

export default CartProvider;
