
import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

// Lazy-loading Pages
const Home = React.lazy(() => import("./pages/buyer/Home"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const Login = React.lazy(() => import("./pages/auth/Login"));
const Signup = React.lazy(() => import("./pages/auth/Signup"));
const ResetPassword = React.lazy(() => import("./pages/auth/ResetPassword"));
const AuthCallback = React.lazy(() => import("./pages/auth/Callback"));
const ProducerActivation = React.lazy(() => import("./pages/auth/ProducerActivation"));
const Library = React.lazy(() => import("./pages/buyer/Library"));
const Trending = React.lazy(() => import("./pages/buyer/Trending"));
const New = React.lazy(() => import("./pages/buyer/New"));
const Playlists = React.lazy(() => import("./pages/buyer/Playlists"));
const Genres = React.lazy(() => import("./pages/buyer/Genres"));
const Producers = React.lazy(() => import("./pages/buyer/Producers"));
const Charts = React.lazy(() => import("./pages/buyer/Charts"));
const Orders = React.lazy(() => import("./pages/buyer/Orders"));
const Cart = React.lazy(() => import("./pages/buyer/Cart"));
const Search = React.lazy(() => import("./pages/buyer/Search"));
const Settings = React.lazy(() => import("./pages/user/Settings"));
const ProducerSettings = React.lazy(() => import("./pages/producer/Settings"));
const Contact = React.lazy(() => import("./pages/Contact"));
const BuyerProfile = React.lazy(() => import("./pages/buyer/BuyerProfile"));
const ProducerProfile = React.lazy(() => import("./pages/producer/ProducerProfile"));
const BeatDetail = React.lazy(() => import("./pages/buyer/BeatDetail"));
const ProducerDashboard = React.lazy(() => import("./pages/producer/Dashboard"));
const UploadBeat = React.lazy(() => import("./pages/producer/UploadBeat"));
const ProducerBeats = React.lazy(() => import("./pages/producer/Beats"));
const Royalties = React.lazy(() => import("./pages/producer/Royalties"));
const ProtectedProducerRoute = React.lazy(() => import("@/components/auth/ProtectedProducerRoute").then(module => ({ default: module.default })));

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
  const playlistId = location.pathname.split("/").pop();
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
                <ScrollToTop />
                <Toaster />
                <Sonner position="top-right" expand={true} closeButton={true} />
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                    {/* Public Routes */}
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

                    {/* Library Routes */}
                    <Route path="/library" element={<Library />} />
                    <Route path="/buyer/library" element={<Navigate to="/library" replace />} />
                    <Route path="/favorites" element={<Library />} />
                    <Route path="/purchased" element={<Navigate to="/library" replace />} />
                    <Route path="/my-playlists" element={<Library />} />
                    <Route path="/my-playlists/:playlistId" element={<Library />} />
                    <Route path="/orders" element={<Orders />} />

                    {/* Producer Routes */}
                    <Route path="/producer/dashboard" element={<ProtectedProducerRoute><ProducerDashboard /></ProtectedProducerRoute>} />
                    <Route path="/producer/upload" element={<ProtectedProducerRoute><UploadBeat /></ProtectedProducerRoute>} />
                    <Route path="/producer/beats" element={<ProtectedProducerRoute><ProducerBeats /></ProtectedProducerRoute>} />
                    <Route path="/producer/royalties" element={<ProtectedProducerRoute><Royalties /></ProtectedProducerRoute>} />
                    <Route path="/producer/settings" element={<ProtectedProducerRoute><ProducerSettings /></ProtectedProducerRoute>} />

                    {/* Catch-all Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </SidebarProvider>
            </PlayerProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
