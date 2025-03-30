
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Beat } from '@/types';
import { useNavigate } from 'react-router-dom';
import { notifyBeatFavorited } from '@/lib/notificationService';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  beat: Beat;
  licenseType?: 'basic' | 'premium' | 'exclusive' | 'custom';
  className?: string;
  text?: string;
  showIcon?: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddToCartButton({
  beat,
  licenseType = 'basic',
  className,
  text = 'Add to Cart',
  showIcon = true,
  variant = 'default',
  size = 'default'
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsLoading(true);
    try {
      addToCart(beat, licenseType);
      toast.success(`Added ${beat.title} to cart`);
      
      // Example: Send notification to producer that their beat is in someone's cart
      // This is just for demonstration - in a real app you might not want to notify for every cart add
      if (user.id !== beat.producer_id) {
        await notifyBeatFavorited(
          beat.producer_id,
          beat.id,
          beat.title,
          user.name
        );
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddToCart}
      disabled={isLoading}
    >
      {isLoading ? (
        <span className="animate-spin mr-2 h-4 w-4 border-b-2 border-current rounded-full"></span>
      ) : (
        showIcon && <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      {text}
    </Button>
  );
}
