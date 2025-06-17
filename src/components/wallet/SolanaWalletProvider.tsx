
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
    // Force devnet for testing phase
    const network = useMemo(() => WalletAdapterNetwork.Devnet, []);

    // Use QuickNode RPC endpoint for devnet
    const endpoint = useMemo(() => {
        return 'https://greatest-proportionate-hill.solana-devnet.quiknode.pro/41e5bfe38a70eea3949938349ff08bed95d6290b/';
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
                httpHeaders: {
                    'Content-Type': 'application/json',
                },
                wsEndpoint: undefined, // Use HTTP only for QuickNode
            }}
        >
            <WalletProvider 
                wallets={wallets} 
                autoConnect={true}
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

export default SolanaWalletProvider;
