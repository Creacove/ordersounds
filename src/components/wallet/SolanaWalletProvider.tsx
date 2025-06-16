
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
    const [optimalEndpoint, setOptimalEndpoint] = useState<string>('');
    const [isEndpointReady, setIsEndpointReady] = useState(false);

    // Use devnet for development, mainnet for production
    const network = useMemo(() => {
        return process.env.NODE_ENV === 'production' 
            ? WalletAdapterNetwork.Mainnet 
            : WalletAdapterNetwork.Devnet;
    }, []);

    // Get optimal RPC endpoint on mount
    useEffect(() => {
        const initializeEndpoint = async () => {
            try {
                const networkKey = network === WalletAdapterNetwork.Mainnet ? 'mainnet' : 'devnet';
                const endpoint = await getBestRpcEndpoint(networkKey);
                setOptimalEndpoint(endpoint);
                setIsEndpointReady(true);
                console.log('🚀 Optimal RPC endpoint initialized:', endpoint);
            } catch (error) {
                console.error('❌ Failed to get optimal endpoint, using fallback:', error);
                // Use fallback endpoint
                const fallback = network === WalletAdapterNetwork.Mainnet 
                    ? 'https://api.mainnet-beta.solana.com'
                    : 'https://api.devnet.solana.com';
                setOptimalEndpoint(fallback);
                setIsEndpointReady(true);
            }
        };

        initializeEndpoint();
    }, [network]);

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

    // Don't render until we have an endpoint
    if (!isEndpointReady || !optimalEndpoint) {
        return <div>Initializing Solana connection...</div>;
    }

    return (
        <ConnectionProvider 
            endpoint={optimalEndpoint}
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
