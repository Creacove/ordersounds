
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import '@/wallet-button.css';

interface WalletButtonProps {
  className?: string;
  buttonClass?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  variant?: 'default' | 'embedded';
}

const WalletButton = ({ 
  className = "", 
  buttonClass = "",
  showIcon = true,
  showLabel = true,
  variant = 'default'
}: WalletButtonProps) => {
  const { publicKey, disconnect, connected } = useWallet();
  
  // Get a shortened version of the wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  // Determine if button should be full width
  const isFullWidth = buttonClass.includes('w-full');
  
  // CSS classes based on variant
  const containerClasses = `${className} ${isFullWidth ? 'w-full' : ''}`;
  
  const connectedButtonClasses = `
    rounded-full flex items-center gap-2 transition-all hover:shadow-md
    ${variant === 'embedded' ? 'bg-purple-600/90 hover:bg-purple-700 text-white' : 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-900'}
    ${buttonClass}
  `;

  return (
    <div className={containerClasses}>
      {connected && publicKey ? (
        <Button 
          variant={variant === 'embedded' ? 'purple' : 'outline'}
          className={connectedButtonClasses}
          onClick={() => disconnect()}
        >
          {showIcon && <Wallet className={`h-4 w-4 ${variant === 'embedded' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`} />}
          {showLabel && (
            <span className={`font-medium ${variant === 'embedded' ? 'text-white' : 'text-purple-700 dark:text-purple-300'}`}>
              {shortenAddress(publicKey.toString())}
            </span>
          )}
        </Button>
      ) : (
        <WalletMultiButton className={`wallet-adapter-button-trigger rounded-full transform hover:scale-105 transition-all shadow-sm hover:shadow ${isFullWidth ? 'w-full justify-center' : ''} ${variant === 'embedded' ? 'wallet-embedded' : ''}`} />
      )}
    </div>
  );
};

export default WalletButton;
