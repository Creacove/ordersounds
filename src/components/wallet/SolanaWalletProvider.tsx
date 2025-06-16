import React, { FC, ReactNode, useMemo, useEffect, useState } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    CoinbaseWalletAdapter,
    CloverWalletAdapter,
    SalmonWalletAdapter,
    TorusWalletAdapter,
    LedgerWalletAdapter,
    MathWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { getBestRpcEndpoint } from '@/utils/payment/rpcHealthCheck';

interface SolanaWalletProviderProps {
    children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
    const [currentEndpoint, setCurrentEndpoint] = useState<string>('');

    // Use devnet for development, mainnet for production
    const network = useMemo(() => {
        return process.env.NODE_ENV === 'production' 
            ? WalletAdapterNetwork.Mainnet 
            : WalletAdapterNetwork.Devnet;
    }, []);

    // Set default endpoint immediately, optimize in background
    const defaultEndpoint = useMemo(() => {
        return network === WalletAdapterNetwork.Mainnet 
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com';
    }, [network]);

    // Initialize with default endpoint immediately
    useEffect(() => {
        setCurrentEndpoint(defaultEndpoint);
        console.log('🚀 Solana provider initialized with default endpoint:', defaultEndpoint);

        // Optimize endpoint in background (non-blocking)
        const optimizeEndpoint = async () => {
            try {
                const networkKey = network === WalletAdapterNetwork.Mainnet ? 'mainnet' : 'devnet';
                const optimalEndpoint = await getBestRpcEndpoint(networkKey);
                
                if (optimalEndpoint !== defaultEndpoint) {
                    console.log('🔄 Upgrading to optimal endpoint:', optimalEndpoint);
                    setCurrentEndpoint(optimalEndpoint);
                }
            } catch (error) {
                console.warn('⚠️ Failed to optimize endpoint, keeping default:', error);
                // Keep using default endpoint
            }
        };

        // Run optimization in background after a short delay
        setTimeout(optimizeEndpoint, 1000);
    }, [network, defaultEndpoint]);

    // Configure wallet adapters
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new CoinbaseWalletAdapter(),
            new CloverWalletAdapter(),
            new SalmonWalletAdapter(),
            new TorusWalletAdapter(),
            new LedgerWalletAdapter(),
            new MathWalletAdapter(),
        ],
        [network]
    );

    // Render immediately with default endpoint - no blocking
    return (
        <ConnectionProvider 
            endpoint={currentEndpoint || defaultEndpoint}
            config={{
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
            }}
        >
            <WalletProvider 
                wallets={wallets} 
                autoConnect={true}
                onError={(error) => {
                    console.error('Wallet error:', error);
                    // Don't show toast for every wallet error to avoid spam
                    if (error.message.includes('User rejected')) {
                        console.log('User rejected wallet connection');
                    }
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaWalletProvider;
