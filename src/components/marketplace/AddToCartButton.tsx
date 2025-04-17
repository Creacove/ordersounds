
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
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
  const navigate = useNavigate();

  // Check if beat is in favorites
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      
      try {
        // Check if the user has this beat in their favorites
        const { data, error } = await supabase.rpc('get_user_favorites', {
          user_id_param: user.id
        });
        
        if (error) {
          console.error('Error checking favorite status:', error);
          return;
        }
        
        // Check if beat.id exists in the favorites array
        const beatIds = Array.isArray(data) ? data.map(item => item.beat_id) : [];
        setIsFavorite(beatIds.includes(beat.id));
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [beat.id, user]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      // Add to cart - simplified for this example
      // Your actual cart logic will go here
      setTimeout(() => {
        toast("Added to cart");
      }, 500);
    } catch (error) {
      toast.error("Failed to add item to cart.");
      console.error("Error adding item to cart:", error);
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
      
      if (isFavorite) {
        // Remove from favorites using RPC
        const { error } = await supabase.rpc('remove_favorite', {
          user_id_param: user.id,
          beat_id_param: beat.id
        });
        
        if (error) throw error;
        
        setIsFavorite(false);
        toast("Removed from favorites");
      } else {
        // Add to favorites using RPC
        const { error } = await supabase.rpc('add_favorite', {
          user_id_param: user.id,
          beat_id_param: beat.id
        });
        
        if (error) throw error;
        
        // Create notification for beat owner if present
        if (beat.producer_id) {
          await supabase.rpc('create_notification', {
            recipient_id_param: beat.producer_id,
            sender_id_param: user.id,
            type_param: 'favorite',
            title_param: 'New favorite',
            body_param: `Someone favorited your beat "${beat.title}"`,
            entity_id_param: beat.id,
            entity_type_param: 'beat'
          }).catch(err => {
            console.error('Error creating notification:', err);
            // Don't throw, we still want to mark as favorite even if notification fails
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

  if (iconOnly) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={className}
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button
        className={className}
        onClick={handleAddToCart}
        disabled={isAdding}
      >
        {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
        Add to Cart
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
