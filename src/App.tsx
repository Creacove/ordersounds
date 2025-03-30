
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';

// Contexts
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { CartProvider } from './context/CartContext';

// Layouts
import { MainLayout } from './components/layout/MainLayout';
import { MainLayoutWithPlayer } from './components/layout/MainLayoutWithPlayer';

// Core pages (non-lazy loaded)
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Callback from './pages/auth/Callback';
import NotFound from './pages/NotFound';
import Contact from './pages/Contact';

// Admin routes
import { AdminRoute } from './pages/admin/AdminRoute';
import { PaymentAdminRoute } from './pages/admin/PaymentAdminRoute';

// Lazy loaded pages
const Index = lazy(() => import('./pages/Index'));
const Home = lazy(() => import('./pages/buyer/Home'));
const BeatDetail = lazy(() => import('./pages/buyer/BeatDetail'));
const Trending = lazy(() => import('./pages/buyer/Trending'));
const New = lazy(() => import('./pages/buyer/New'));
const Genres = lazy(() => import('./pages/buyer/Genres'));
const Search = lazy(() => import('./pages/buyer/Search'));
const Playlists = lazy(() => import('./pages/buyer/Playlists'));
const Library = lazy(() => import('./pages/buyer/Library'));
const LibraryIndex = lazy(() => import('./pages/buyer/LibraryIndex'));
const Cart = lazy(() => import('./pages/buyer/Cart'));
const BuyerProfile = lazy(() => import('./pages/buyer/BuyerProfile'));

// Producer pages
const ProducerDashboard = lazy(() => import('./pages/producer/Dashboard'));
const ProducerBeats = lazy(() => import('./pages/producer/Beats'));
const UploadBeat = lazy(() => import('./pages/producer/UploadBeat'));
const ProducerProfile = lazy(() => import('./pages/producer/ProducerProfile'));
const ProducerRoyalties = lazy(() => import('./pages/producer/Royalties'));
const ProducerSettings = lazy(() => import('./pages/producer/Settings'));

// User settings
const UserSettings = lazy(() => import('./pages/user/Settings'));

// Fallback component for lazy loading
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <PlayerProvider>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Auth Routes - No Player */}
                <Route element={<MainLayout>{<Outlet />}</MainLayout>}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/auth/callback" element={<Callback />} />
                  <Route path="/contact" element={<Contact />} />
                </Route>

                {/* Main Routes - With Player */}
                <Route element={<MainLayoutWithPlayer>{<Outlet />}</MainLayoutWithPlayer>}>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/beat/:beatId" element={<BeatDetail />} />
                  <Route path="/trending" element={<Trending />} />
                  <Route path="/new" element={<New />} />
                  <Route path="/genres" element={<Genres />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/playlists" element={<Playlists />} />
                  <Route path="/favorites" element={<Library />} />
                  <Route path="/purchased" element={<Library />} />
                  <Route path="/my-playlists" element={<Library />} />
                  <Route path="/library" element={<LibraryIndex />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/buyer/:buyerId" element={<BuyerProfile />} />
                  <Route path="/settings" element={<UserSettings />} />

                  {/* Producer Routes */}
                  <Route path="/producer/dashboard" element={<ProducerDashboard />} />
                  <Route path="/producer/beats" element={<ProducerBeats />} />
                  <Route path="/producer/upload" element={<UploadBeat />} />
                  <Route path="/producer/:producerId" element={<ProducerProfile />} />
                  <Route path="/producer/royalties" element={<ProducerRoyalties />} />
                  <Route path="/producer/settings" element={<ProducerSettings />} />
                  
                  {/* Admin Routes */}
                  <Route path="/admin/*" element={<AdminRoute />} />
                </Route>

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </PlayerProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
