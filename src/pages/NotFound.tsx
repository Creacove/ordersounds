
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    document.title = "Page Not Found | Creacove";
  }, [location.pathname]);

  // Check if the path starts with "playlist/" (without the 's')
  const isPlaylistPath = location.pathname.includes('/playlist/');
  const correctPath = isPlaylistPath 
    ? location.pathname.replace('/playlist/', '/playlists/') 
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Oops! Page not found</p>
        
        {isPlaylistPath && (
          <div className="mb-6 p-3 bg-muted rounded-md">
            <p className="text-sm mb-2">
              It looks like you're trying to access a playlist with an incorrect URL.
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link to={correctPath || '/'}>
                Go to correct playlist URL
              </Link>
            </Button>
          </div>
        )}
        
        <div className="flex flex-col xs:flex-row gap-2 justify-center">
          <Button asChild variant="default">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
