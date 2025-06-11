
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { useWalletSync } from '@/hooks/useWalletSync';
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
  const { publicKey, connected } = useWallet();
  const { disconnectAndSync, isWalletSynced } = useWalletSync();
  
  // Get a shortened version of the wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={`${className} ${buttonClass.includes('w-full') ? 'w-full' : ''}`}>
      {connected && publicKey ? (
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
      ) : (
        <WalletMultiButton className={`wallet-adapter-button-trigger rounded-full transform hover:scale-105 transition-all shadow-sm hover:shadow ${buttonClass.includes('w-full') ? 'w-full justify-center' : ''}`} />
      )}
    </div>
  );
};

export default WalletButton;
