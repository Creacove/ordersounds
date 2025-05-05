import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import SolanaWalletProvider from './components/wallet/SolanaWalletProvider.tsx'


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


createRoot(document.getElementById("root")!).render(<App />);
