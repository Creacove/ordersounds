
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface WalletConnectButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

export function WalletConnectButton({ className, variant = 'default' }: WalletConnectButtonProps) {
  const { connected, connecting } = useWallet();

  return (
    <div className={className}>
      {connecting ? (
        <Button disabled variant={variant}>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </Button>
      ) : (
        <WalletMultiButton className="wallet-adapter-button" />
      )}
    </div>
  );
}
