import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/context/CartContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider } from '@/context/AuthContext';
import { SolanaWalletProvider } from '@/components/wallets/SolanaWalletProvider';

// Import routes
import Home from '@/pages/buyer/Home';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import BeatDetail from '@/pages/buyer/BeatDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProtectedProducerRoute from '@/components/auth/ProtectedProducerRoute';

// Producer routes
import ProducerDashboard from '@/pages/producer/Dashboard';
import UploadBeat from '@/pages/producer/UploadBeat';

// Admin routes
import { PaymentAdminRoute } from '@/pages/admin/PaymentAdminRoute';

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <SolanaWalletProvider>
          <CartProvider>
            <PlayerProvider>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/beat/:id" element={<BeatDetail />} />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <ProducerDashboard />
                    </ProtectedRoute>
                  } 
                />

                {/* Producer Routes */}
                <Route 
                  path="/upload" 
                  element={
                    <ProtectedProducerRoute>
                      <UploadBeat />
                    </ProtectedProducerRoute>
                  } 
                />

                {/* Admin Routes */}
                <Route 
                  path="/admin/payments" 
                  element={
                    <PaymentAdminRoute>
                      {/* Payment Admin Component */}
                    </PaymentAdminRoute>
                  } 
                />
              </Routes>
            </PlayerProvider>
          </CartProvider>
        </SolanaWalletProvider>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
