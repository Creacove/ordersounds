
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WalletAuthPromptProps {
  isConnected: boolean;
  walletAddress?: string;
}

export const WalletAuthPrompt: React.FC<WalletAuthPromptProps> = ({ 
  isConnected, 
  walletAddress 
}) => {
  const navigate = useNavigate();

  if (!isConnected) return null;

  return (
    <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
          <AlertCircle className="h-5 w-5" />
          Authentication Required
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
          Your wallet is connected but you need to log in to sync it with your account and make purchases.
        </p>
        {walletAddress && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3 font-mono">
            Wallet: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </p>
        )}
        <Button 
          onClick={() => navigate('/login')}
          className="w-full"
          size="sm"
        >
          <LogIn className="h-4 w-4 mr-2" />
          Log In to Continue
        </Button>
      </CardContent>
    </Card>
  );
};
