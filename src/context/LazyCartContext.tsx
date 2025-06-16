
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartProvider, useCart } from './CartContext';
import { useLightweightCart } from '@/hooks/useLightweightCart';

interface LazyCartContextType {
  isFullCartLoaded: boolean;
  loadFullCart: () => void;
  lightweightCart: ReturnType<typeof useLightweightCart>;
}

const LazyCartContext = createContext<LazyCartContextType | null>(null);

export const useLazyCart = () => {
  const context = useContext(LazyCartContext);
  if (!context) {
    throw new Error('useLazyCart must be used within a LazyCartProvider');
  }
  return context;
};

interface LazyCartProviderProps {
  children: React.ReactNode;
}

export const LazyCartProvider: React.FC<LazyCartProviderProps> = ({ children }) => {
  const [isFullCartLoaded, setIsFullCartLoaded] = useState(false);
  const [shouldLoadFullCart, setShouldLoadFullCart] = useState(false);
  const lightweightCart = useLightweightCart();

  const loadFullCart = () => {
    console.log('LazyCart: Loading full cart context');
    setShouldLoadFullCart(true);
    setIsFullCartLoaded(true);
  };

  // Auto-load full cart when user navigates to cart page
  useEffect(() => {
    const checkRoute = () => {
      if (window.location.pathname === '/cart' && !isFullCartLoaded) {
        loadFullCart();
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    
    return () => {
      window.removeEventListener('popstate', checkRoute);
    };
  }, [isFullCartLoaded]);

  const contextValue = {
    isFullCartLoaded,
    loadFullCart,
    lightweightCart
  };

  if (shouldLoadFullCart) {
    return (
      <CartProvider>
        <LazyCartContext.Provider value={contextValue}>
          <CartSyncWrapper>{children}</CartSyncWrapper>
        </LazyCartContext.Provider>
      </CartProvider>
    );
  }

  return (
    <LazyCartContext.Provider value={contextValue}>
      {children}
    </LazyCartContext.Provider>
  );
};

// Component to sync lightweight cart with full cart when full cart loads
const CartSyncWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { cartItems } = useCart();
  const { lightweightCart } = useLazyCart();

  useEffect(() => {
    if (cartItems.length > 0) {
      console.log('LazyCart: Syncing lightweight cart with full cart');
      lightweightCart.syncWithFullCart(cartItems);
    }
  }, [cartItems, lightweightCart]);

  return <>{children}</>;
};
