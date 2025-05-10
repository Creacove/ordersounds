
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import SolanaWalletProvider from './components/wallet/SolanaWalletProvider.tsx'

// Log environment loading (can be removed in production)
if (import.meta.env.DEV) {
  console.log('Environment variables loaded:', {
    hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_KEY,
  });
}

//Polyfills for Solana wallet adapter
import { Buffer } from 'buffer';
window.Buffer = Buffer;

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <BrowserRouter>
    <SolanaWalletProvider>
      <App />
    </SolanaWalletProvider>
  </BrowserRouter>
);
