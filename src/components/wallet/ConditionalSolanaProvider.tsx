
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

  // Don't load Solana provider unless needed
  if (!needsWallet) {
    return <>{children}</>;
  }

  return (
    <React.Suspense fallback={<div>Loading wallet...</div>}>
      <SolanaWalletProvider>
        {children}
      </SolanaWalletProvider>
    </React.Suspense>
  );
};

export default ConditionalSolanaProvider;
