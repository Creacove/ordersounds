
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCartLightweight } from '@/hooks/useCartLightweight';
import { useFavoritesLightweight } from '@/hooks/useFavoritesLightweight';
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
  const { isInCart, addToCart, removeFromCart } = useCartLightweight();
  const { isFavorite, toggleFavorite } = useFavoritesLightweight();
  const navigate = useNavigate();

  console.log('🛒 AddToCartButton rendered with:', {
    beatId: beat.id,
    beatTitle: beat.title,
    user: user ? { id: user.id, email: user.email } : 'No user',
    isInCart: isInCart(beat.id)
  });

  const handleAddToCart = async () => {
    console.log('🛒 handleAddToCart clicked for beat:', beat.id, beat.title);
    
    if (!user) {
      console.log('🛒 No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    const isAlreadyInCart = isInCart(beat.id);
    console.log('🛒 Current cart status for beat:', beat.id, 'isInCart:', isAlreadyInCart);
    
    if (isAdding) {
      console.log('🛒 Already adding, ignoring click');
      return;
    }
    
    setIsAdding(true);
    console.log('🛒 Starting add to cart process...');
    
    try {
      if (isAlreadyInCart) {
        console.log('🛒 Removing from cart...');
        removeFromCart(beat.id);
        toast.success("Removed from cart");
        console.log('🛒 Successfully removed from cart');
      } else {
        console.log('🛒 Adding to cart with basic license...');
        addToCart(beat.id, 'basic');
        toast.success("Added to cart");
        console.log('🛒 Successfully added to cart');
      }
    } catch (error) {
      console.error("🛒 Error updating cart:", error);
      toast.error("Failed to update cart");
    } finally {
      console.log('🛒 Setting isAdding to false after delay');
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
      await toggleFavorite(beat.id);
    } catch (error) {
      console.error('Error updating favorite:', error);
      toast.error("Could not update favorites");
    } finally {
      setIsFavoriting(false);
    }
  };
  
  const isItemInCart = isInCart(beat.id);
  const isBeatFavorite = isFavorite(beat.id);

  console.log('🛒 AddToCartButton render state:', {
    beatId: beat.id,
    isItemInCart,
    isAdding,
    userExists: !!user
  });

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
