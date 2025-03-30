import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addFavorite, removeFavorite, checkIfFavorite } from '@/actions/favorite-actions';
import { notifyBeatFavorited } from '@/actions/notification-actions';
import { toast } from 'sonner';
import { Beat } from '@/types';

interface AddToCartButtonProps {
  beat: Beat;
  className?: string;
  iconOnly?: boolean;
}

export function AddToCartButton({ beat, className, iconOnly }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkFavorite = async () => {
      if (user) {
        const favorite = await checkIfFavorite(beat.id);
        setIsFavorite(favorite);
      }
    };

    checkFavorite();
  }, [beat.id, user]);

  const handleAddToCart = async () => {
    setIsAdding(true);
    try {
      addItem(beat);
      toast({
        title: "Added to cart",
        description: `${beat.title} has been added to your cart.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart.",
        variant: "destructive",
      });
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
        await removeFavorite(beat.id);
        setIsFavorite(false);
        toast({
          title: "Removed from favorites",
          description: `${beat.title} has been removed from your favorites`,
        });
      } else {
        await addFavorite(beat.id);
        setIsFavorite(true);
        notifyBeatFavorited(beat.id);
        toast({
          title: "Added to favorites",
          description: `${beat.title} has been added to your favorites`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update favorites. Please try again.",
        variant: "destructive",
      });
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
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Heart
            className={`h-5 w-5 ${isFavorite ? 'text-red-500' : 'text-gray-500'
              }`}
          />
        )}
      </Button>
    </div>
  );
}
