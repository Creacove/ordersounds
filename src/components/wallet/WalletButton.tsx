
import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet, AlertCircle, ChevronDown, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { useWalletSync } from '@/hooks/useWalletSync';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
  const navigate = useNavigate();
  
  // Safely access wallet hooks - they might not be available if Solana provider isn't loaded
  let wallet, walletSync;
  try {
    wallet = useWallet();
    walletSync = useWalletSync();
  } catch (error) {
    console.log('Wallet provider not available, showing fallback');
    wallet = {
      publicKey: null,
      connected: false,
      connecting: false,
      wallet: null,
      select: () => {},
      disconnect: () => {}
    };
    walletSync = {
      disconnectAndSync: async () => {},
      isWalletSynced: false,
      needsAuth: false,
      manualSyncTrigger: async () => false,
      syncStatus: 'idle',
      lastError: null
    };
  }
  
  const { publicKey, connected, connecting, wallet: walletAdapter, select, disconnect } = wallet;
  const { 
    disconnectAndSync, 
    isWalletSynced, 
    needsAuth, 
    manualSyncTrigger,
    syncStatus,
    lastError
  } = walletSync;
  
  const { user } = useAuth();
  
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleAuthRequired = () => {
    navigate('/login');
  };

  const handleChangeWallet = () => {
    select(null);
  };

  const handleDisconnect = async () => {
    await disconnectAndSync();
  };

  const handleManualSync = async () => {
    console.log('🔧 Manual sync button clicked');
    const success = await manualSyncTrigger();
    if (success) {
      console.log('✅ Manual sync completed successfully');
    } else {
      console.log('❌ Manual sync failed');
    }
  };

  // Get sync status icon and text
  const getSyncStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return {
          icon: <Clock className="h-3 w-3 animate-pulse text-amber-500" />,
          text: 'Syncing...',
          color: 'text-amber-600 dark:text-amber-400'
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-3 w-3 text-green-500" />,
          text: 'Synced',
          color: 'text-green-600 dark:text-green-400'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-3 w-3 text-red-500" />,
          text: 'Sync Failed',
          color: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          icon: <Clock className="h-3 w-3 text-gray-500" />,
          text: 'Ready',
          color: 'text-gray-600 dark:text-gray-400'
        };
    }
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`rounded-full flex items-center gap-2 transition-all hover:shadow-md bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-900 ${buttonClass}`}
                >
                  {showIcon && <Wallet className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                  {showLabel && (
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-purple-700 dark:text-purple-300">
                        {shortenAddress(publicKey.toString())}
                      </span>
                      <div className="flex items-center gap-1">
                        {(() => {
                          const statusDisplay = getSyncStatusDisplay();
                          return (
                            <>
                              {statusDisplay.icon}
                              <span className={`text-xs ${statusDisplay.color}`}>
                                {statusDisplay.text}
                              </span>
                            </>
                          );
                        })()}
                        {walletAdapter?.adapter?.name && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            • {walletAdapter.adapter.name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  <ChevronDown className="h-3 w-3 text-purple-600 dark:text-purple-400 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={handleManualSync} className="cursor-pointer">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  Force Sync
                  {lastError && (
                    <span className="text-xs text-red-500 ml-2 truncate">
                      ({lastError.substring(0, 20)}...)
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleChangeWallet} className="cursor-pointer">
                  <Wallet className="h-4 w-4 mr-2" />
                  Change Wallet
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDisconnect} className="cursor-pointer text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </>
      ) : (
        <div className={buttonClass.includes('w-full') ? 'w-full' : ''}>
          <Button 
            variant="outline"
            className={`rounded-full ${buttonClass.includes('w-full') ? 'w-full justify-center' : ''}`}
            onClick={() => navigate('/cart')}
          >
            {showIcon && <Wallet className="h-4 w-4 mr-2" />}
            {showLabel && 'Connect Wallet'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default WalletButton;
