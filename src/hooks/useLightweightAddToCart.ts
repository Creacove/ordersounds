
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLightweightCart } from './useLightweightCart';
import { Beat } from '@/types';

export function useLightweightAddToCart() {
  const { user } = useAuth();
  const { isInCart, toggleCartItem } = useLightweightCart();
  const navigate = useNavigate();

  const handleAddToCart = async (beat: Beat) => {
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('useLightweightAddToCart: Adding beat to cart:', beat.title);
    toggleCartItem(beat.id, 'basic');
  };

  return {
    handleAddToCart,
    isInCart
  };
}
