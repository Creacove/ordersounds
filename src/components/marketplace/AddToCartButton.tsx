
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useBeats } from '@/hooks/useBeats';
import { Beat } from '@/types';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  beat: Beat;
  className?: string;
  iconOnly?: boolean;
}

export function AddToCartButton({ beat, className, iconOnly }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const { user } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const { isFavorite, toggleFavorite } = useBeats();
  const navigate = useNavigate();

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
      } else {
        await addToCart({
          ...beat, 
          selected_license: 'basic'
        });
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      // Error handling is done in the cart context
    } finally {
      setTimeout(() => {
        setIsAdding(false);
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
      console.log('AddToCartButton: Toggling favorite for beat:', beat.id);
      await toggleFavorite(beat.id);
    } catch (error) {
      console.error('AddToCartButton: Error updating favorite:', error);
      toast.error("Could not update favorites");
    } finally {
      setIsFavoriting(false);
    }
  };
  
  const isItemInCart = isInCart(beat.id);
  const isBeatFavorite = isFavorite(beat.id);

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
        aria-label={isBeatFavorite ? "Remove from favorites" : "Add to favorites"}
      >
        {isFavoriting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 transition-colors ${isBeatFavorite ? 'text-red-500 fill-red-500' : 'text-gray-500 hover:text-red-400'}`}
          />
        )}
      </Button>
    </div>
  );
}
