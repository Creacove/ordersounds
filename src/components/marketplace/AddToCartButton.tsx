import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AddToCartButtonProps {
  beat: Beat;
  className?: string;
  iconOnly?: boolean;
}

export function AddToCartButton({ beat, className, iconOnly }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const { user } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  
  // Use ref to track component mount state to avoid memory leaks
  const isMountedRef = React.useRef(true);
  
  // Clean up function
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Check favorite status once on mount
  useEffect(() => {
    if (!user) return;
    
    const checkFavorite = async () => {
      try {
        // Use a timeout to avoid long-running operations
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const queryPromise = supabase
          .from('users')
          .select('favorites')
          .eq('id', user.id)
          .single();
          
        const response = await Promise.race([
          queryPromise,
          timeoutPromise
        ]);
        
        // Type-safe response handling
        const userData = response && 
          typeof response === 'object' && 
          'data' in response ? 
          response.data : null;
          
        const error = response && 
          typeof response === 'object' && 
          'error' in response ? 
          response.error : null;
        
        if (error || !isMountedRef.current) return;
        
        // Fixed: Handle favorites in a type-safe way
        const favorites = userData && typeof userData === 'object' ? userData.favorites || [] : [];
        
        if (Array.isArray(favorites)) {
          setIsFavorite(favorites.some((fav: any) => fav.beat_id === beat.id));
        }
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [beat.id, user]);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const isAlreadyInCart = isInCart(beat.id);
    
    if (isAdding) return;
    
    setIsAdding(true);
    
    try {
      if (isAlreadyInCart) {
        await removeFromCart(beat.id);
        if (isMountedRef.current) {
          toast.success("Removed from cart");
        }
      } else {
        await addToCart({
          ...beat, 
          selected_license: 'basic'
        });
        if (isMountedRef.current) {
          toast.success("Added to cart");
        }
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      if (isMountedRef.current) {
        toast.error("Failed to update cart");
      }
    } finally {
      // Use shorter timeout for better responsiveness
      setTimeout(() => {
        if (isMountedRef.current) {
          setIsAdding(false);
        }
      }, 300);
    }
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate('/login');
      return;
    }

    if (isFavoriting) return;
    
    try {
      setIsFavoriting(true);
      
      // Get current favorites
      const response = await supabase
        .from('users')
        .select('favorites')
        .eq('id', user.id)
        .single();
      
      // Type-safe response handling
      const userData = response && 
        typeof response === 'object' && 
        'data' in response ? 
        response.data : null;
        
      const userError = response && 
        typeof response === 'object' && 
        'error' in response ? 
        response.error : null;
      
      if (userError) {
        throw userError;
      }
      
      let favorites = userData?.favorites || [];
      
      if (!Array.isArray(favorites)) {
        favorites = [];
      }
      
      // Optimistic UI update
      const wasInFavorites = isFavorite;
      if (isMountedRef.current) {
        setIsFavorite(!wasInFavorites);
      }
      
      if (wasInFavorites) {
        // Remove from favorites
        favorites = favorites.filter((fav: any) => fav.beat_id !== beat.id);
        
        await supabase
          .from('users')
          .update({ favorites })
          .eq('id', user.id);
        
        if (isMountedRef.current) {
          toast("Removed from favorites");
        }
      } else {
        // Add to favorites
        favorites.push({
          beat_id: beat.id,
          added_at: new Date().toISOString()
        });
        
        await supabase
          .from('users')
          .update({ favorites })
          .eq('id', user.id);
        
        // Create notification for beat owner if present
        if (beat.producer_id) {
          await supabase
            .from('notifications')
            .insert({
              recipient_id: beat.producer_id,
              sender_id: user.id,
              notification_type: 'favorite',
              title: 'New favorite',
              body: `Someone favorited your beat "${beat.title}"`,
              is_read: false,
              related_entity_id: beat.id,
              related_entity_type: 'beat'
            });
        }
        
        if (isMountedRef.current) {
          toast("Added to favorites");
        }
      }
    } catch (error) {
      // Revert optimistic update on error
      if (isMountedRef.current) {
        setIsFavorite(isFavorite);
        toast.error("Could not update favorites");
      }
      console.error('Error updating favorite:', error);
    } finally {
      if (isMountedRef.current) {
        setIsFavoriting(false);
      }
    }
  };
  
  const isItemInCart = isInCart(beat.id);

  // Icon-only variant of the button (for compact displays)
  if (iconOnly) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full transition-all hover:scale-105 shadow-sm hover:shadow ${className}`}
        onClick={handleAddToCart}
        disabled={isAdding}
        aria-label={isItemInCart ? "Remove from cart" : "Add to cart"}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isItemInCart ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Standard button with text and icon
  return (
    <div className="flex items-center space-x-2">
      <Button
        className={`font-medium transition-all hover:shadow-md ${isItemInCart ? 'hover:bg-secondary/90' : 'hover:bg-primary/90'} ${className}`}
        onClick={handleAddToCart}
        disabled={isAdding}
        variant={isItemInCart ? "secondary" : "default"}
      >
        {isAdding ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : isItemInCart ? (
          <>
            <Check className="mr-2 h-4 w-4" />
            In Cart
          </>
        ) : (
          <>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </>
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleFavoriteClick}
        disabled={isFavoriting}
        className="rounded-full hover:bg-secondary/20 transition-all"
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavoriting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 transition-colors ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-400'}`}
          />
        )}
      </Button>
    </div>
  );
}
