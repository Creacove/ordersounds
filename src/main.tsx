
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeNetworkOptimizations } from './utils/networkOptimization'

// Initialize network optimizations for Nigerian users
initializeNetworkOptimizations();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
