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
  const { fetchPurchasedBeats } = useBeats();

  useEffect(() => {
    if (!user) return;
    
    const channel = supabase
      .channel('library-purchase-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_purchased_beats',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New purchase detected in Library:', payload);
          fetchPurchasedBeats();
          setActiveTab("purchased");
          setShowPurchaseSuccess(true);
          
          setTimeout(() => {
            setShowPurchaseSuccess(false);
          }, 10000);
        }
      )
      .subscribe();
      
    return () => {
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

  useEffect(() => {
    document.title = "Library | OrderSOUNDS";
    
    const fromPurchase = location.state?.fromPurchase;
    const purchaseSuccess = localStorage.getItem('purchaseSuccess');
    const redirectToLibrary = localStorage.getItem('redirectToLibrary');
    
    if (fromPurchase || purchaseSuccess === 'true' || redirectToLibrary === 'true') {
      setShowPurchaseSuccess(true);
      
      setActiveTab("purchased");
      
      const currentPathname = location.pathname;
      navigate(currentPathname, { replace: true, state: { activeTab: "purchased" } });
      
      localStorage.removeItem('purchaseSuccess');
      localStorage.removeItem('purchaseTime');
      localStorage.removeItem('redirectToLibrary');
      localStorage.removeItem('paymentInProgress');
      
      fetchPurchasedBeats().then(() => {
        toast.success('Your purchase was successful! Your beats are now in your library.', {
          duration: 5000,
        });
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

  const handleTabChange = (value) => {
    setActiveTab(value);
    if (value === "favorites") {
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
          <TabsList className={cn(
            "w-full grid grid-cols-3 mb-4 md:mb-6 tabs-standard", 
            isMobile ? "mobile-tabs-standard" : ""
          )}>
            <TabsTrigger 
              value="purchased" 
              className={cn(
                "tab-trigger-standard",
                isMobile ? "mobile-tab-trigger" : "",
                activeTab === "purchased" ? "text-primary" : ""
              )}
            >
              Purchased Beats
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className={cn(
                "tab-trigger-standard",
                isMobile ? "mobile-tab-trigger" : "",
                activeTab === "favorites" ? "text-primary" : ""
              )}
            >
              Favorites
            </TabsTrigger>
            <TabsTrigger 
              value="playlists" 
              className={cn(
                "tab-trigger-standard",
                isMobile ? "mobile-tab-trigger" : "",
                activeTab === "playlists" ? "text-primary" : ""
              )}
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
