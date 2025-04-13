
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SidebarProvider } from "@/components/ui/sidebar";

// Pages
import Home from "./pages/buyer/Home";  // Change back to Home page as root route
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ResetPassword from "./pages/auth/ResetPassword";
import AuthCallback from "./pages/auth/Callback";
import ProducerActivation from "./pages/auth/ProducerActivation";
import Library from "./pages/buyer/Library";
import Trending from "./pages/buyer/Trending";
import New from "./pages/buyer/New";
import Playlists from "./pages/buyer/Playlists";
import Genres from "./pages/buyer/Genres";
import Producers from "./pages/buyer/Producers";
import Charts from "./pages/buyer/Charts";
import Orders from "./pages/buyer/Orders";
import Cart from "./pages/buyer/Cart";
import Search from "./pages/buyer/Search";
import Settings from "./pages/user/Settings";
import ProducerSettings from "./pages/producer/Settings";
import Contact from "./pages/Contact";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import ProducerProfile from "./pages/producer/ProducerProfile";
import BeatDetail from "./pages/buyer/BeatDetail";

// Producer pages
import ProducerDashboard from "./pages/producer/Dashboard";
import UploadBeat from "./pages/producer/UploadBeat";
import ProducerBeats from "./pages/producer/Beats";
import Royalties from "./pages/producer/Royalties";
import { ProtectedProducerRoute } from "./components/auth/ProtectedProducerRoute";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Helper component for dynamic redirect
const PlaylistRedirect = () => {
  const location = useLocation();
  const playlistId = location.pathname.split('/').pop();
  return <Navigate to={`/playlists/${playlistId}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <PlayerProvider>
              <SidebarProvider>
                <Toaster />
                <Sonner position="top-right" expand={true} closeButton={true} />
                <Routes>
                  {/* Public Routes - accessible to all users */}
                  <Route path="/" element={<Home />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/new" element={<New />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/playlists/:playlistId" element={<Playlists />} />
                  <Route path="/playlist/:playlistId" element={<PlaylistRedirect />} />
                  <Route path="/genres" element={<Genres />} />
                  <Route path="/producers" element={<Producers />} />
                  <Route path="/charts" element={<Charts />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/beat/:beatId" element={<BeatDetail />} />
                  
                  {/* Profile Routes */}
                  <Route path="/buyer/:buyerId" element={<BuyerProfile />} />
                  <Route path="/producer/:producerId" element={<ProducerProfile />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/producer-activation" element={<ProducerActivation />} />
                  
                  {/* Library Routes - these might require auth */}
                  <Route path="/library" element={<Library />} />
                  <Route path="/buyer/library" element={<Navigate to="/library" replace />} />
                  <Route path="/favorites" element={<Library />} />
                  <Route path="/purchased" element={<Navigate to="/library" replace />} />
                  <Route path="/my-playlists" element={<Library />} />
                  <Route path="/my-playlists/:playlistId" element={<Library />} />
                  <Route path="/orders" element={<Orders />} />
                  
                  {/* Producer Routes - Protected by ProtectedProducerRoute */}
                  <Route path="/producer/dashboard" element={
                    <ProtectedProducerRoute>
                      <ProducerDashboard />
                    </ProtectedProducerRoute>
                  } />
                  <Route path="/producer/upload" element={
                    <ProtectedProducerRoute>
                      <UploadBeat />
                    </ProtectedProducerRoute>
                  } />
                  <Route path="/producer/beats" element={
                    <ProtectedProducerRoute>
                      <ProducerBeats />
                    </ProtectedProducerRoute>
                  } />
                  <Route path="/producer/royalties" element={
                    <ProtectedProducerRoute>
                      <Royalties />
                    </ProtectedProducerRoute>
                  } />
                  <Route path="/producer/settings" element={
                    <ProtectedProducerRoute>
                      <ProducerSettings />
                    </ProtectedProducerRoute>
                  } />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </SidebarProvider>
            </PlayerProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
