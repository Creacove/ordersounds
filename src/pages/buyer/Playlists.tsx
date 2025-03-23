
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";

export default function Playlists() {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "Playlists | Creacove";
  }, []);

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Playlists</h1>
        
        <div className="bg-muted p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-4">Explore Curated Playlists</h2>
          <p className="text-muted-foreground mb-6">
            Discover handpicked beats in our curated playlists or create your own.
          </p>
          
          {!user ? (
            <p className="text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline">Sign in</a> to create your own playlists
            </p>
          ) : (
            <p className="text-sm text-primary">Feature coming soon!</p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
