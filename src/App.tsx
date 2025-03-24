
import { PlayerProvider } from '@/context/PlayerContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/buyer/Home';
import Library from '@/pages/buyer/Library';
import Search from '@/pages/buyer/Search';
import Cart from '@/pages/buyer/Cart';
import BuyerProfile from '@/pages/buyer/BuyerProfile';
import Dashboard from '@/pages/producer/Dashboard';
import Beats from '@/pages/producer/Beats';
import ProducerProfile from '@/pages/producer/ProducerProfile';
import UploadBeat from '@/pages/producer/UploadBeat';
import Trending from '@/pages/buyer/Trending';
import New from '@/pages/buyer/New';
import Genres from '@/pages/buyer/Genres';
import Orders from '@/pages/buyer/Orders';
import Playlists from '@/pages/buyer/Playlists';
import Charts from '@/pages/buyer/Charts';
import Producers from '@/pages/buyer/Producers';
import Royalties from '@/pages/producer/Royalties';
import Contact from '@/pages/Contact';
import Settings from '@/pages/user/Settings';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <CartProvider>
            <PlayerProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Buyer Routes */}
                <Route path="/home" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/search" element={<Search />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/buyer/:id" element={<BuyerProfile />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/new" element={<New />} />
                <Route path="/genres" element={<Genres />} />
                <Route path="/purchased" element={<Orders />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/playlists/:id" element={<Playlists />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/producers" element={<Producers />} />
                <Route path="/favorites" element={<Orders />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Producer Routes */}
                <Route path="/producer/dashboard" element={<Dashboard />} />
                <Route path="/producer/beats" element={<Beats />} />
                <Route path="/producer/:id" element={<ProducerProfile />} />
                <Route path="/producer/upload" element={<UploadBeat />} />
                <Route path="/producer/royalties" element={<Royalties />} />
                <Route path="/producer/settings" element={<Settings />} />
                
                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
            </PlayerProvider>
          </CartProvider>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
