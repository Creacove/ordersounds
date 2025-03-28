
import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export default function Library() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showPurchaseSuccess, setShowPurchaseSuccess] = useState(false);

  useEffect(() => {
    document.title = "Library | OrderSOUNDS";
    
    // Check if we're coming from a successful purchase
    const fromPurchase = location.state?.fromPurchase;
    if (fromPurchase) {
      setShowPurchaseSuccess(true);
      
      // Only show the success message once
      navigate(location.pathname, { replace: true });
      
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
  }, [location]);

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
      <Outlet />
    </MainLayoutWithPlayer>
  );
}
