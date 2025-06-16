
import React, { FC, ReactNode, useMemo } from 'react';
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

interface SolanaWalletProviderProps {
    children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
    // Use devnet for development, mainnet for production
    const network = useMemo(() => {
        return process.env.NODE_ENV === 'production' 
            ? WalletAdapterNetwork.Mainnet 
            : WalletAdapterNetwork.Devnet;
    }, []);

    // Configure RPC endpoints with multiple fallbacks for better reliability
    const endpoint = useMemo(() => {
        if (process.env.NODE_ENV === 'production') {
            // Production - use mainnet with fallbacks
            return 'https://api.mainnet-beta.solana.com';
        } else {
            // Development - use devnet with multiple fallback options
            // Using Helius as primary since it's more reliable than default Solana RPC
            return 'https://devnet.helius-rpc.com/?api-key=public';
        }
    }, []);

    // Get fallback endpoints for connection redundancy
    const getFallbackEndpoints = useMemo(() => {
        if (process.env.NODE_ENV === 'production') {
            return [
                'https://api.mainnet-beta.solana.com',
                'https://solana-api.projectserum.com',
                'https://rpc.ankr.com/solana'
            ];
        } else {
            return [
                'https://devnet.helius-rpc.com/?api-key=public',
                'https://api.devnet.solana.com',
                'https://rpc.ankr.com/solana_devnet',
                'https://solana-devnet.g.alchemy.com/v2/demo'
            ];
        }
    }, []);

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

    return (
        <ConnectionProvider 
            endpoint={endpoint}
            config={{
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                wsEndpoint: undefined, // Disable WebSocket to avoid connection issues
                httpHeaders: {
                    'Content-Type': 'application/json',
                },
                fetch: async (url, options) => {
                    // Custom fetch with retry logic and fallback endpoints
                    const endpoints = getFallbackEndpoints;
                    let lastError: Error | null = null;
                    
                    for (let i = 0; i < endpoints.length; i++) {
                        try {
                            const endpoint = endpoints[i];
                            const response = await fetch(url.replace(endpoint, endpoint), {
                                ...options,
                                timeout: 10000, // 10 second timeout
                            });
                            
                            if (response.ok) {
                                console.log(`✅ RPC connection successful: ${endpoint}`);
                                return response;
                            } else if (response.status === 403) {
                                console.warn(`🚫 RPC rate limited (403): ${endpoint}`);
                                lastError = new Error(`RPC endpoint rate limited: ${response.status}`);
                                continue;
                            } else {
                                console.warn(`⚠️ RPC error ${response.status}: ${endpoint}`);
                                lastError = new Error(`RPC error: ${response.status}`);
                                continue;
                            }
                        } catch (error) {
                            console.error(`❌ RPC connection failed: ${endpoints[i]}`, error);
                            lastError = error as Error;
                            continue;
                        }
                    }
                    
                    // If all endpoints failed, throw the last error
                    throw lastError || new Error('All RPC endpoints failed');
                }
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
