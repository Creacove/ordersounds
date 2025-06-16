
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/types';
import { toast } from 'sonner';

export function useAddToCart() {
  const { user } = useAuth();
  const { addToCart, isInCart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const handleAddToCart = async (beat: Beat) => {
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('useAddToCart: Adding beat to cart:', beat.title);
    
    const isAlreadyInCart = isInCart(beat.id);
    
    try {
      if (isAlreadyInCart) {
        console.log('useAddToCart: Removing beat from cart:', beat.id);
        await removeFromCart(beat.id);
        toast.success(`Removed "${beat.title}" from cart`);
      } else {
        console.log('useAddToCart: Adding beat to cart with basic license:', beat.id);
        
        // Ensure we have all required beat data
        const beatWithLicense = {
          ...beat,
          selected_license: 'basic' as const,
          // Ensure producer_name is set
          producer_name: beat.producer_name || 'Unknown Producer',
          // Ensure pricing fields are set
          basic_license_price_local: beat.basic_license_price_local || 0,
          basic_license_price_diaspora: beat.basic_license_price_diaspora || 0
        };
        
        await addToCart(beatWithLicense);
        toast.success(`Added "${beat.title}" to cart`);
      }
    } catch (error) {
      console.error('useAddToCart: Error updating cart:', error);
      toast.error('Failed to update cart. Please try again.');
    }
  };

  return {
    handleAddToCart,
    isInCart
  };
}
