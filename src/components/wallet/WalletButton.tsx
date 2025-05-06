
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

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
  const { publicKey, disconnect, connected } = useWallet();
  
  // Get a shortened version of the wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={className}>
      {connected && publicKey ? (
        <Button 
          variant="outline" 
          className={`rounded-full flex items-center gap-2 transition-all hover:shadow-md bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-900 ${buttonClass}`}
          onClick={() => disconnect()}
        >
          {showIcon && <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
          {showLabel && (
            <span className="font-medium text-purple-700 dark:text-purple-300">
              {shortenAddress(publicKey.toString())}
            </span>
          )}
        </Button>
      ) : (
        <WalletMultiButton className="wallet-adapter-button-trigger rounded-full transform hover:scale-105 transition-all shadow-sm hover:shadow" />
      )}
    </div>
  );
};

export default WalletButton;
