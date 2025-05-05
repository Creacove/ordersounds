
import React, { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    BackpackWalletAdapter,
    BraveWalletAdapter,
    CoinbaseWalletAdapter,
    CloverWalletAdapter,
    SalmonWalletAdapter,
    SlopeWalletAdapter,
    TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

interface SolanaWalletProviderProps {
    children: ReactNode;
}

const SolanaWalletProvider: FC<SolanaWalletProviderProps> = ({ children }) => {
    // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
    const network = WalletAdapterNetwork.Devnet;

    // You can also provide a custom RPC endpoint.
    const endpoint = useMemo(() => 
        process.env.NODE_ENV === 'production' 
            ? 'https://api.mainnet-beta.solana.com'
            : 'https://api.devnet.solana.com', 
        []
    );

    // @solana/wallet-adapter-wallets imports all the adapters but supports tree shaking 
    // and lazy loading --only the wallets you configure here will be compiled into your app
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter({ network }),
            new BackpackWalletAdapter(),
            new BraveWalletAdapter(),
            new CoinbaseWalletAdapter(),
            new CloverWalletAdapter(),
            new SalmonWalletAdapter(),
            new SlopeWalletAdapter(),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default SolanaWalletProvider;
