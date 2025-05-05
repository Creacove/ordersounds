
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

  // Check if beat is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      
      try {
        // Check if the user has this beat in their favorites
        const { data: userData, error } = await supabase
          .from('users')
          .select('favorites')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error('Error checking favorite status:', error);
          return;
        }
        
        // Check if beat.id exists in the favorites array
        const favorites = userData?.favorites || [];
        
        // Ensure favorites is treated as an array
        if (Array.isArray(favorites)) {
          setIsFavorite(favorites.some((fav: any) => fav.beat_id === beat.id));
        } else {
          console.warn('favorites is not an array:', favorites);
          setIsFavorite(false);
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
    
    setIsAdding(true);
    try {
      console.log("Add to cart clicked for beat:", beat.id, beat.title);
      if (isAlreadyInCart) {
        console.log("Removing from cart:", beat.id);
        await removeFromCart(beat.id);
        toast.success("Removed from cart");
      } else {
        console.log("Adding to cart:", beat.id);
        await addToCart({
          ...beat, 
          selected_license: 'basic'
        });
      }
    } catch (error) {
      toast.error("Failed to update cart.");
      console.error("Error updating cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleFavoriteClick = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsFavoriting(true);
      
      // Get the user's current favorites
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorites')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        throw userError;
      }
      
      let favorites = userData?.favorites || [];
      
      // Ensure favorites is treated as an array
      if (!Array.isArray(favorites)) {
        favorites = [];
      }
      
      if (isFavorite) {
        // Remove from favorites
        favorites = favorites.filter((fav: any) => fav.beat_id !== beat.id);
        
        await supabase
          .from('users')
          .update({ favorites })
          .eq('id', user.id);
        
        setIsFavorite(false);
        toast("Removed from favorites");
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
        
        setIsFavorite(true);
        toast("Added to favorites");
      }
    } catch (error) {
      toast.error("Could not update favorites. Please try again.");
      console.error('Error updating favorite:', error);
    } finally {
      setIsFavoriting(false);
    }
  };
  
  const isItemInCart = isInCart(beat.id);

  if (iconOnly) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={className}
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        {isAdding ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isItemInCart ? (
          <Check className="h-4 w-4" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        className={className}
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
      >
        {isFavoriting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500'}`}
          />
        )}
      </Button>
    </div>
  );
}
