
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

interface ConditionalSolanaProviderProps {
    children: ReactNode;
}

const ConditionalSolanaProvider: FC<ConditionalSolanaProviderProps> = ({ children }) => {
    // Use devnet for development, mainnet for production
    const network = useMemo(() => {
        return process.env.NODE_ENV === 'production' 
            ? WalletAdapterNetwork.Mainnet 
            : WalletAdapterNetwork.Devnet;
    }, []);

    // Configure RPC endpoints with fallbacks
    const endpoint = useMemo(() => {
        if (process.env.NODE_ENV === 'production') {
            // Production - use mainnet
            return 'https://api.mainnet-beta.solana.com';
        } else {
            // Development - use devnet with fallbacks
            return 'https://api.devnet.solana.com';
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
            }}
        >
            <WalletProvider 
                wallets={wallets} 
                autoConnect={false}
                onError={(error) => {
                    console.error('Wallet error:', error);
                }}
            >
                <WalletModalProvider>
                    {children}
                </WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default ConditionalSolanaProvider;
