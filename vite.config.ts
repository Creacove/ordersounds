
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
      // Only block problematic WalletConnect packages, not all of them
      '@walletconnect/time': path.resolve(__dirname, 'node_modules/@walletconnect/time'),
      '@walletconnect/heartbeat': path.resolve(__dirname, 'node_modules/@walletconnect/heartbeat'),
    },
  },
  build: {
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Optimize rollup options for large dependencies
    rollupOptions: {
      // Remove external blocking - let bundler handle it
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
          // Separate wallet adapters that may use WalletConnect
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
  // Optimize dependencies - be more selective about exclusions
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js',
      '@solana/spl-token',
      // Allow wallet adapters to include their dependencies
      '@solana/wallet-adapter-wallets'
    ],
    exclude: [
      // Only exclude the most problematic packages
      '@reown/appkit',
      '@reown/appkit-controllers',
      '@reown/appkit-core',
      '@reown/appkit-ui',
      // Exclude other problematic crypto libraries that we don't use
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
