
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
    historyApiFallback: true,
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util', 'events'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix dayjs default export issue
      "dayjs": path.resolve(__dirname, "node_modules/dayjs/dayjs.min.js"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate essential Solana wallet dependencies only
          'solana-wallet': [
            '@solana/wallet-adapter-base',
            '@solana/wallet-adapter-react',
            '@solana/wallet-adapter-react-ui',
            '@solana/web3.js',
            '@solana/spl-token'
          ],
          // Essential wallet adapters without WalletConnect
          'wallet-adapters': [
            '@solana/wallet-adapter-phantom',
            '@solana/wallet-adapter-solflare',
            '@solana/wallet-adapter-coinbase'
          ],
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom'
          ],
          'ui': [
            'lucide-react'
          ]
        }
      },
      maxParallelFileOps: 2,
    },
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@solana/wallet-adapter-react',
      '@solana/web3.js',
      '@solana/wallet-adapter-phantom',
      '@solana/wallet-adapter-solflare',
      '@solana/wallet-adapter-coinbase'
    ],
    // Remove WalletConnect packages completely for Devnet-only operation
    exclude: [
      'dayjs'
    ]
  },
  define: {
    global: 'globalThis',
    'process.env': '{}',
    // Fix module format issues
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));
