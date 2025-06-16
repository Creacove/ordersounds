import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PurchasedBeats } from "@/components/library/PurchasedBeats";
import { FavoriteBeats } from "@/components/library/FavoriteBeats";
import { UserPlaylists } from "@/components/library/UserPlaylists";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useBeats } from "@/hooks/useBeats";
import { supabase } from '@/integrations/supabase/client';

export default function Library() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("purchased");
  const isMobile = useIsMobile();
  const { fetchPurchasedBeats, refreshUserFavorites } = useBeats();

  console.log('Library: Component rendered with activeTab:', activeTab);

  // Enhanced real-time subscription for library updates
  useEffect(() => {
    if (!user) return;
    
    console.log('Library: Setting up real-time subscription for user:', user.id);
    
    const channel = supabase
      .channel('library-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Library: New purchase detected:', payload);
          
          // Force immediate update
          fetchPurchasedBeats();
          setActiveTab("purchased");
          setShowPurchaseSuccess(true);
          
          // Show success message
          toast.success('🎉 Purchase successful! Beat added to your library.');
          
          setTimeout(() => {
            setShowPurchaseSuccess(false);
          }, 8000);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Library: Order updated:', payload);
          if (payload.new?.status === 'completed') {
            console.log('Library: Order completed, refreshing data...');
            
            // Delay to ensure all related data is inserted
            setTimeout(() => {
              fetchPurchasedBeats();
              setActiveTab("purchased");
            }, 1000);
          }
        }
      )
      .subscribe();
      
    return () => {
      console.log('Library: Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user, fetchPurchasedBeats]);

  useEffect(() => {
    if (location.pathname.includes("/favorites")) {
      setActiveTab("favorites");
    } else if (location.pathname.includes("/my-playlists")) {
      setActiveTab("playlists");
    } else {
      setActiveTab("purchased");
    }
    
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.pathname, location.state]);

  // Enhanced purchase success detection
  useEffect(() => {
    document.title = "Library | OrderSOUNDS";
    
    const fromPurchase = location.state?.fromPurchase;
    const purchaseSuccess = localStorage.getItem('purchaseSuccess');
    const redirectToLibrary = localStorage.getItem('redirectToLibrary');
    
    if (fromPurchase || purchaseSuccess === 'true' || redirectToLibrary === 'true') {
      console.log('Library: Detected successful purchase, setting up UI...');
      
      setShowPurchaseSuccess(true);
      setActiveTab("purchased");
      
      const currentPathname = location.pathname;
      navigate(currentPathname, { replace: true, state: { activeTab: "purchased" } });
      
      // Clean up localStorage
      localStorage.removeItem('purchaseSuccess');
      localStorage.removeItem('purchaseTime');
      localStorage.removeItem('redirectToLibrary');
      localStorage.removeItem('paymentInProgress');
      
      // Force refresh purchased beats data
      fetchPurchasedBeats().then(() => {
        console.log('Library: Purchased beats refreshed after successful purchase');
        toast.success('Your purchase was successful! Your beats are now in your library.', {
          duration: 5000,
        });
      }).catch(error => {
        console.error('Library: Error refreshing purchased beats:', error);
      });
      
      const timer = setTimeout(() => {
        setShowPurchaseSuccess(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate, fetchPurchasedBeats]);

  useEffect(() => {
    localStorage.removeItem('pendingOrderId');
    localStorage.removeItem('paystackReference');
    localStorage.removeItem('orderItems');
    localStorage.removeItem('paymentInProgress');
    localStorage.removeItem('redirectToLibrary');
  }, []);

  const handleTabChange = (value: string) => {
    console.log('Library: Tab change to:', value);
    setActiveTab(value);
    
    // Refresh favorites when switching to favorites tab
    if (value === "favorites") {
      console.log('Library: Refreshing favorites for favorites tab');
      refreshUserFavorites();
      navigate("/favorites", { replace: true });
    } else if (value === "playlists") {
      navigate("/my-playlists", { replace: true });
    } else {
      navigate("/library", { replace: true });
    }
  };

  if (!user) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8 md:py-12 text-center">
          <div className="max-w-md mx-auto">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view your library</h1>
            <p className="text-muted-foreground mb-6">
              You need to be logged in to access your purchased beats and playlists.
            </p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  const currentPath = location.pathname;
  return (
    <MainLayoutWithPlayer activeTab="library" currentPath={currentPath}>
      {showPurchaseSuccess && (
        <div className="w-full bg-green-500 text-white py-3 px-4">
          <div className="container flex items-center justify-between">
            <p className="font-medium">🎉 Your purchase was successful! Your new beats are now in your library.</p>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-green-600"
              onClick={() => setShowPurchaseSuccess(false)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      
      <div className="container py-4 md:py-8">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Your Library</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-4 md:mb-6 rounded-md overflow-hidden">
            <TabsTrigger 
              value="purchased" 
              className="rounded-none border-0"
            >
              Purchased Beats
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="rounded-none border-0"
            >
              Favorites
            </TabsTrigger>
            <TabsTrigger 
              value="playlists" 
              className="rounded-none border-0"
            >
              My Playlists
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchased" className="space-y-4 focus-visible:outline-none">
            <PurchasedBeats />
          </TabsContent>
          
          <TabsContent value="favorites" className="space-y-4 focus-visible:outline-none">
            <FavoriteBeats />
          </TabsContent>
          
          <TabsContent value="playlists" className="space-y-4 focus-visible:outline-none">
            <UserPlaylists />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutWithPlayer>
  );
}
