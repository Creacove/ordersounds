
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

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

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

  // Get or create cart with improved error handling
  const getOrCreateCart = async () => {
    try {
      console.log('CartContext: Getting or creating cart for user:', user?.id || 'guest');
      
      if (user) {
        console.log('CartContext: Creating/finding authenticated user cart');
        
        // Try to find existing cart first
        let { data: existingCart, error: selectError } = await supabase
          .from('carts')
          .select('id')
          .eq('user_id', user.id)
          .is('session_id', null)
          .maybeSingle();

        if (selectError) {
          console.error('CartContext: Error finding existing user cart:', selectError);
          throw selectError;
        }

        if (!existingCart) {
          console.log('CartContext: Creating new user cart');
          
          const { data: newCart, error } = await supabase
            .from('carts')
            .insert({ 
              user_id: user.id,
              session_id: null
            })
            .select('id')
            .single();

          if (error) {
            console.error('CartContext: Error creating user cart:', error);
            throw error;
          }
          
          console.log('CartContext: Created new user cart:', newCart.id);
          existingCart = newCart;
        } else {
          console.log('CartContext: Using existing user cart:', existingCart.id);
        }

        return existingCart.id;
      } else {
        return await createGuestCart();
      }
    } catch (error) {
      console.error('CartContext: Failed to get/create cart:', error);
      throw error;
    }
  };

  // Create guest cart helper
  const createGuestCart = async () => {
    console.log('CartContext: Creating/finding guest cart');
    const sessionId = getSessionId();
    console.log('CartContext: Using session ID for guest:', sessionId);
    
    let { data: existingCart, error: selectError } = await supabase
      .from('carts')
      .select('id')
      .is('user_id', null)
      .eq('session_id', sessionId)
      .maybeSingle();

    if (selectError) {
      console.error('CartContext: Error finding existing guest cart:', selectError);
      throw selectError;
    }

    if (!existingCart) {
      console.log('CartContext: Creating new guest cart');
      const { data: newCart, error } = await supabase
        .from('carts')
        .insert({ 
          user_id: null,
          session_id: sessionId
        })
        .select('id')
        .single();

      if (error) {
        console.error('CartContext: Error creating guest cart:', error);
        throw error;
      }
      console.log('CartContext: Created new guest cart:', newCart.id);
      existingCart = newCart;
    } else {
      console.log('CartContext: Using existing guest cart:', existingCart.id);
    }

    return existingCart.id;
  };

  // Load cart items from database with improved error handling
  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      console.log('CartContext: Loading cart items');
      
      const currentCartId = await getOrCreateCart();
      if (!currentCartId) {
        console.error('CartContext: No cart ID available');
        setCartItems([]);
        return;
      }

      setCartId(currentCartId);
      console.log('CartContext: Loading items for cart:', currentCartId);

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
            audio_preview,
            audio_file,
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
        console.error('CartContext: Error loading cart items:', error);
        throw error;
      }

      console.log('CartContext: Loaded cart items raw data:', items);

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
          preview_url: item.beats.audio_preview || '',
          full_track_url: item.beats.audio_file || '',
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

      console.log('CartContext: Formatted cart items:', formattedItems);
      setCartItems(formattedItems);
    } catch (error) {
      console.error('CartContext: Error loading cart:', error);
      toast.error('Failed to load cart items');
      setCartItems([]);
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
          console.log('CartContext: Real-time cart update detected');
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
      console.log('CartContext: Adding beat to cart:', beat.title, 'License:', beat.selected_license);
      
      const currentCartId = cartId || await getOrCreateCart();
      if (!currentCartId) {
        console.error('CartContext: Failed to get cart ID');
        toast.error('Failed to create cart. Please try again.');
        return;
      }

      const licenseType = beat.selected_license || 'basic';
      console.log('CartContext: Using license type:', licenseType);

      // Check if item already exists in cart
      const existingItem = cartItems.find(item => item.beat_id === beat.id);

      if (existingItem) {
        console.log('CartContext: Updating existing cart item');
        const { error } = await supabase
          .from('cart_items')
          .update({ license_type: licenseType })
          .eq('id', existingItem.id);

        if (error) {
          console.error('CartContext: Error updating cart item:', error);
          throw error;
        }
        console.log('CartContext: Successfully updated cart item');
        toast.success('Cart updated');
      } else {
        console.log('CartContext: Adding new cart item');
        const { data, error } = await supabase
          .from('cart_items')
          .insert({
            cart_id: currentCartId,
            beat_id: beat.id,
            license_type: licenseType,
            quantity: 1
          })
          .select();

        if (error) {
          console.error('CartContext: Error adding cart item:', error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log('CartContext: Successfully added cart item:', data[0].id);
          toast.success('Added to cart');
        } else {
          console.error('CartContext: No data returned from insert');
          toast.error('Failed to add item to cart');
          return;
        }
      }

      // Reload cart items to reflect changes
      await loadCartItems();
    } catch (error) {
      console.error('CartContext: Error in addToCart:', error);
      toast.error('Failed to add item to cart. Please try again.');
    }
  };

  const addMultipleToCart = useCallback(async (beats: Beat[]) => {
    try {
      console.log('CartContext: Adding multiple beats to cart:', beats.length);
      
      const currentCartId = cartId || await getOrCreateCart();
      if (!currentCartId) {
        toast.error('Failed to create cart');
        return;
      }

      const newBeats = beats.filter(beat => 
        !cartItems.some(item => item.beat_id === beat.id)
      );

      if (newBeats.length === 0) {
        toast.info('All selected beats are already in your cart');
        return;
      }

      const cartItemsToInsert = newBeats.map(beat => ({
        cart_id: currentCartId,
        beat_id: beat.id,
        license_type: 'basic',
        quantity: 1
      }));

      const { data, error } = await supabase
        .from('cart_items')
        .insert(cartItemsToInsert)
        .select();

      if (error) {
        console.error('CartContext: Error adding multiple items:', error);
        throw error;
      }

      if (data && data.length > 0) {
        console.log('CartContext: Successfully added multiple items:', data.length);
        toast.success(`Added ${newBeats.length} beat${newBeats.length > 1 ? 's' : ''} to cart`);
        await loadCartItems();
      } else {
        toast.error('Failed to add items to cart');
      }
    } catch (error) {
      console.error('CartContext: Error adding multiple to cart:', error);
      toast.error('Failed to add items to cart');
    }
  }, [cartItems, cartId]);

  const removeFromCart = async (beatId: string): Promise<boolean> => {
    try {
      console.log('CartContext: Removing beat from cart:', beatId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('beat_id', beatId)
        .eq('cart_id', cartId);

      if (error) {
        console.error('CartContext: Error removing from cart:', error);
        throw error;
      }

      console.log('CartContext: Successfully removed from cart');
      await loadCartItems();
      return true;
    } catch (error) {
      console.error('CartContext: Error removing from cart:', error);
      toast.error('Failed to remove item from cart');
      return false;
    }
  };

  const clearCart = useCallback(async () => {
    try {
      if (!cartId) return;

      console.log('CartContext: Clearing cart:', cartId);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) {
        console.error('CartContext: Error clearing cart:', error);
        throw error;
      }

      console.log('CartContext: Successfully cleared cart');
      setCartItems([]);
      setItemCount(0);
      setTotalAmount(0);
    } catch (error) {
      console.error('CartContext: Error clearing cart:', error);
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
      console.error("CartContext: Error toggling cart item:", error);
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
