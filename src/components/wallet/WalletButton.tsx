
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle } from 'lucide-react';
import { useWalletSync } from '@/hooks/useWalletSync';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '@/wallet-button.css';

interface WalletButtonProps {
  className?: string;
  buttonClass?: string;
  showIcon?: boolean;
  showLabel?: boolean;
}

const WalletButton = ({ 
  className = "", 
  buttonClass = "",
  showIcon = true,
  showLabel = true
}: WalletButtonProps) => {
  const { publicKey, connected, connecting } = useWallet();
  const { disconnectAndSync, isWalletSynced, needsAuth } = useWalletSync();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get a shortened version of the wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleAuthRequired = () => {
    navigate('/login');
  };

  return (
    <div className={`${className} ${buttonClass.includes('w-full') ? 'w-full' : ''}`}>
      {connected && publicKey ? (
        <>
          {needsAuth ? (
            <Button 
              variant="outline" 
              className={`rounded-full flex items-center gap-2 transition-all hover:shadow-md bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-900 ${buttonClass}`}
              onClick={handleAuthRequired}
            >
              {showIcon && <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
              {showLabel && (
                <div className="flex flex-col items-start">
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {shortenAddress(publicKey.toString())}
                  </span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">
                    Login Required
                  </span>
                </div>
              )}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              className={`rounded-full flex items-center gap-2 transition-all hover:shadow-md bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-900 ${buttonClass}`}
              onClick={disconnectAndSync}
            >
              {showIcon && <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
              {showLabel && (
                <div className="flex flex-col items-start">
                  <span className="font-medium text-purple-700 dark:text-purple-300">
                    {shortenAddress(publicKey.toString())}
                  </span>
                  {isWalletSynced && (
                    <span className="text-xs text-green-600 dark:text-green-400">
                      Synced
                    </span>
                  )}
                </div>
              )}
            </Button>
          )}
        </>
      ) : (
        <WalletMultiButton 
          className={`wallet-adapter-button-trigger rounded-full transform hover:scale-105 transition-all shadow-sm hover:shadow ${buttonClass.includes('w-full') ? 'w-full justify-center' : ''}`}
          disabled={connecting}
        />
      )}
    </div>
  );
};

export default WalletButton;
