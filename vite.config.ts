
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Add historyApiFallback to handle client-side routing
    historyApiFallback: true,
  },
  plugins: [
    react(),
    // Add node polyfills plugin with extended coverage
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events', 'process', 'path'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add specific alias to prevent WalletConnect issues
      '@walletconnect/time': false,
      '@walletconnect/heartbeat': false,
      '@walletconnect/utils': false,
      '@walletconnect/relay-auth': false,
      '@walletconnect/core': false,
      '@walletconnect/sign-client': false,
      '@walletconnect/universal-provider': false,
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize rollup options for large dependencies
    rollupOptions: {
      external: [
        // Completely externalize WalletConnect packages
        '@walletconnect/time',
        '@walletconnect/heartbeat',
        '@walletconnect/utils',
        '@walletconnect/relay-auth',
        '@walletconnect/core',
        '@walletconnect/sign-client',
        '@walletconnect/universal-provider',
        '@reown/appkit',
        '@reown/appkit-controllers',
        'viem',
        'ox'
      ],
      output: {
        // Manual chunk splitting to reduce bundle size
        manualChunks: {
          // Separate Solana wallet dependencies
          'solana-wallet': [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/web3.js',
            '@solana/spl-token'
          ],
          // Separate wallet adapters that don't use WalletConnect
          'solana-adapters': [
            '@solana/wallet-adapter-wallets'
          ],
          // Separate other vendor libraries
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          // Separate UI components
          'ui': [
            'lucide-react'
          ]
        }
      },
      // Increase memory limit and optimize for large bundles
      maxParallelFileOps: 2,
    },
    // Increase memory for the build process
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
  },
  // Optimize dependencies with aggressive exclusions
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js',
      '@solana/spl-token'
    ],
    exclude: [
      // Exclude ALL WalletConnect packages to prevent module resolution issues
      '@walletconnect/time',
      '@walletconnect/heartbeat',
      '@walletconnect/utils',
      '@walletconnect/relay-auth',
      '@walletconnect/core',
      '@walletconnect/sign-client',
      '@walletconnect/universal-provider',
      '@walletconnect/modal',
      '@walletconnect/modal-core',
      '@walletconnect/modal-ui',
      '@reown/appkit',
      '@reown/appkit-controllers',
      '@reown/appkit-core',
      '@reown/appkit-ui',
      // Exclude other problematic crypto libraries
      'viem',
      'ox',
      'wagmi'
    ]
  },
  // Define global constants to help with tree shaking and compatibility
  define: {
    global: 'globalThis',
    'process.env': '{}',
    // Add WalletConnect globals to prevent undefined errors
    '__WALLETCONNECT_PROJECT_ID__': '""',
    '__WALLETCONNECT_RELAY_URL__': '""',
  },
}));
