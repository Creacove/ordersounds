
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

export default function Library() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("purchased");

  // Set the active tab based on the current path
  useEffect(() => {
    if (location.pathname.includes("/favorites")) {
      setActiveTab("favorites");
    } else if (location.pathname.includes("/my-playlists")) {
      setActiveTab("playlists");
    } else {
      setActiveTab("purchased");
    }
  }, [location.pathname]);

  useEffect(() => {
    document.title = "Library | OrderSOUNDS";
    
    // Check if we're coming from a successful purchase
    const fromPurchase = location.state?.fromPurchase;
    if (fromPurchase) {
      setShowPurchaseSuccess(true);
      
      // Only show the success message once by replacing the current location state
      const currentPathname = location.pathname;
      navigate(currentPathname, { replace: true });
      
      // Show a welcome toast
      toast.success('Welcome to your library! You can now enjoy your beats.', {
        duration: 5000,
      });
      
      // Clear the success message after some time
      const timer = setTimeout(() => {
        setShowPurchaseSuccess(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  // Double check for pending orders that might need clearing
  useEffect(() => {
    const pendingOrderId = localStorage.getItem('pendingOrderId');
    const paystackReference = localStorage.getItem('paystackReference');
    
    if (pendingOrderId && paystackReference) {
      // Remove the pending order info
      localStorage.removeItem('pendingOrderId');
      localStorage.removeItem('paystackReference');
    }
  }, []);

  const handleTabChange = (value) => {
    setActiveTab(value);
    // Update URL to reflect the current tab
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
        <div className="container py-12 text-center">
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

  return (
    <MainLayoutWithPlayer>
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
      
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-6">Your Library</h1>
        
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="purchased">Purchased Beats</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="playlists">My Playlists</TabsTrigger>
          </TabsList>
          
          <TabsContent value="purchased" className="space-y-4">
            <PurchasedBeats />
          </TabsContent>
          
          <TabsContent value="favorites" className="space-y-4">
            <FavoriteBeats />
          </TabsContent>
          
          <TabsContent value="playlists" className="space-y-4">
            <UserPlaylists />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayoutWithPlayer>
  );
}
