
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
  const { publicKey, wallet, disconnect, connected } = useWallet();
  
  // Get a shortened version of the wallet address
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className={className}>
      {connected && publicKey ? (
        <Button 
          variant="outline" 
          className={`rounded-full flex items-center gap-2 ${buttonClass}`}
          onClick={() => disconnect()}
        >
          {showIcon && <Wallet className="h-4 w-4" />}
          {showLabel && shortenAddress(publicKey.toString())}
        </Button>
      ) : (
        <WalletMultiButton className="wallet-adapter-button-trigger rounded-full" />
      )}
    </div>
  );
};

export default WalletButton;
