
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { CartProvider } from '@/context/CartContext';
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider } from '@/context/AuthContext';
import { SolanaWalletProvider } from '@/components/wallets/SolanaWalletProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import routes
import Home from '@/pages/buyer/Home';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import Callback from '@/pages/auth/Callback';
import BeatDetail from '@/pages/buyer/BeatDetail';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import ProtectedProducerRoute from '@/components/auth/ProtectedProducerRoute';

// Producer routes
import ProducerDashboard from '@/pages/producer/Dashboard';
import UploadBeat from '@/pages/producer/UploadBeat';

// Admin routes
import { PaymentAdminRoute } from '@/pages/admin/PaymentAdminRoute';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
                  <Route path="/auth/callback" element={<Callback />} />

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
                  <Route 
                    path="/producer/dashboard" 
                    element={
                      <ProtectedProducerRoute>
                        <ProducerDashboard />
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
    </QueryClientProvider>
  );
}

export default App;
