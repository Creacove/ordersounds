
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";

// Pages
import Index from "./pages/buyer/Home";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
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
import Contact from "./pages/Contact";
import BuyerProfile from "./pages/buyer/BuyerProfile";
import ProducerProfile from "./pages/producer/ProducerProfile";

// Producer pages
import ProducerDashboard from "./pages/producer/Dashboard";
import UploadBeat from "./pages/producer/UploadBeat";
import ProducerBeats from "./pages/producer/Beats";
import Royalties from "./pages/producer/Royalties";
import ProducerSettings from "./pages/producer/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <PlayerProvider>
              <SidebarProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  {/* Buyer Routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/new" element={<New />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/genres" element={<Genres />} />
                  <Route path="/producers" element={<Producers />} />
                  <Route path="/charts" element={<Charts />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/cart" element={<Cart />} />
                  
                  {/* Profile Routes */}
                  <Route path="/buyer/:buyerId" element={<BuyerProfile />} />
                  <Route path="/producer/:producerId" element={<ProducerProfile />} />
                  
                  {/* Library Routes */}
                  <Route path="/favorites" element={<Library />} />
                  <Route path="/purchased" element={<Library />} />
                  <Route path="/my-playlists" element={<Library />} />
                  <Route path="/orders" element={<Orders />} />
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/settings" element={<Settings />} />
                  
                  {/* Producer Routes */}
                  <Route path="/producer/dashboard" element={<ProducerDashboard />} />
                  <Route path="/producer/upload" element={<UploadBeat />} />
                  <Route path="/producer/beats" element={<ProducerBeats />} />
                  <Route path="/producer/royalties" element={<Royalties />} />
                  <Route path="/producer/settings" element={<ProducerSettings />} />
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <PersistentPlayer />
              </SidebarProvider>
            </PlayerProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
