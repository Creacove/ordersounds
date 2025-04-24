
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ScrollToTop } from "./components/utils/ScrollToTop";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "./context/CartContext";
import { PlayerProvider } from "./context/PlayerContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SolanaWalletProvider } from "./components/wallets/SolanaWalletProvider";

// Import pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import Callback from "./pages/auth/Callback";
import ProducerActivation from "./pages/auth/ProducerActivation";
import Cart from "./pages/buyer/Cart";
import Home from "./pages/buyer/Home";
import UserSettings from "./pages/user/Settings";
import BeatDetail from "./pages/buyer/BeatDetail";
import Orders from "./pages/buyer/Orders";
import Library from "./pages/buyer/Library";
import Playlists from "./pages/buyer/Playlists";
import LibraryIndex from "./pages/buyer/LibraryIndex";
import ProducerProfile from "./pages/producer/ProducerProfile";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import Contact from "./pages/Contact";
import New from "./pages/buyer/New";
import Trending from "./pages/buyer/Trending";
import Genres from "./pages/buyer/Genres";
import Charts from "./pages/buyer/Charts";
import Collections from "./pages/buyer/Collections";
import Producers from "./pages/buyer/Producers";
import Search from "./pages/buyer/Search";

// Producer Routes
import Dashboard from "./pages/producer/Dashboard";
import ProducerSettings from "./pages/producer/Settings";
import UploadBeat from "./pages/producer/UploadBeat";
import Beats from "./pages/producer/Beats";
import Royalties from "./pages/producer/Royalties";
import { ProtectedProducerRoute } from "./components/auth/ProtectedProducerRoute";
import PaymentAdmin from "./pages/admin/PaymentAdmin";
import PaymentAdminRoute from "./pages/admin/PaymentAdminRoute";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SolanaWalletProvider>
        <AuthProvider>
          <PlayerProvider>
            <CartProvider>
              <ScrollToTop />
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/callback" element={<Callback />} />
                <Route path="/activate-producer" element={<ProducerActivation />} />

                {/* Buyer routes */}
                <Route path="/home" element={<Home />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/settings" element={<UserSettings />} />
                <Route path="/beat/:id" element={<BeatDetail />} />
                <Route path="/library" element={<Library />}>
                  <Route index element={<LibraryIndex />} />
                  <Route path="playlists" element={<Playlists />} />
                  <Route path="playlists/:id" element={<Playlists />} />
                </Route>
                <Route path="/new" element={<New />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/genres/:genre?" element={<Genres />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/producers" element={<Producers />} />
                <Route path="/search" element={<Search />} />
                <Route path="/producer/:id" element={<ProducerProfile />} />
                <Route path="/profile/:id" element={<BuyerProfile />} />
                <Route path="/contact" element={<Contact />} />

                {/* Producer routes */}
                <Route
                  path="/producer/dashboard"
                  element={
                    <ProtectedProducerRoute>
                      <Dashboard />
                    </ProtectedProducerRoute>
                  }
                />
                <Route
                  path="/producer/settings"
                  element={
                    <ProtectedProducerRoute>
                      <ProducerSettings />
                    </ProtectedProducerRoute>
                  }
                />
                <Route
                  path="/producer/upload"
                  element={
                    <ProtectedProducerRoute>
                      <UploadBeat />
                    </ProtectedProducerRoute>
                  }
                />
                <Route
                  path="/producer/beats"
                  element={
                    <ProtectedProducerRoute>
                      <Beats />
                    </ProtectedProducerRoute>
                  }
                />
                <Route
                  path="/producer/royalties"
                  element={
                    <ProtectedProducerRoute>
                      <Royalties />
                    </ProtectedProducerRoute>
                  }
                />
                
                {/* Admin routes */}
                <Route path="/admin/payments" element={<PaymentAdminRoute><PaymentAdmin /></PaymentAdminRoute>} />

                {/* Fallbacks */}
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" replace />} />
              </Routes>
              <Toaster position="top-center" />
            </CartProvider>
          </PlayerProvider>
        </AuthProvider>
      </SolanaWalletProvider>
    </QueryClientProvider>
  );
}

export default App;
