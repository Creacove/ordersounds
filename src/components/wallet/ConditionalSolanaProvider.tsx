
import React, { ReactNode, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Lazy import Solana provider to avoid blocking initial load
const SolanaWalletProvider = React.lazy(() => import('./SolanaWalletProvider'));

interface ConditionalSolanaProviderProps {
  children: ReactNode;
}

// Routes that need Solana wallet functionality
const WALLET_ROUTES = [
  '/cart',
  '/orders',
  '/producer/dashboard',
  '/producer/settings',
  '/settings'
];

const ConditionalSolanaProvider: React.FC<ConditionalSolanaProviderProps> = ({ children }) => {
  const location = useLocation();
  const [needsWallet, setNeedsWallet] = useState(false);

  useEffect(() => {
    const currentPath = location.pathname;
    const isWalletRoute = WALLET_ROUTES.some(route => currentPath.startsWith(route));
    
    if (isWalletRoute && !needsWallet) {
      console.log('🔌 Loading Solana wallet provider for route:', currentPath);
      setNeedsWallet(true);
    }
  }, [location.pathname, needsWallet]);

  // Don't load Solana provider unless needed - just render children directly
  if (!needsWallet) {
    return <>{children}</>;
  }

  return (
    <React.Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
            <div className="text-sm text-muted-foreground">Loading wallet...</div>
          </div>
        </div>
      }
    >
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </React.Suspense>
  );
};

export default ConditionalSolanaProvider;
