import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Clock, 
  List, 
  Library, 
  Heart, 
  LayoutGrid, 
  ChevronRight,
  ChevronLeft,
  Music, 
  LayoutDashboard, 
  Upload, 
  DollarSign, 
  Settings, 
  Disc,
  Grip,
  ShoppingCart,
  User,
  MoreHorizontal,
  LogOut,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const sidebarLinks = [
  { name: "Home", path: "/", icon: Home },
  { name: "Trending", path: "/trending", icon: TrendingUp },
  { name: "New Releases", path: "/new", icon: Clock },
  { name: "Browse", path: "/browse", icon: LayoutGrid },
  { name: "Search", path: "/search", icon: Search },
];

const producerLinks = [
  { name: "Dashboard", path: "/producer/dashboard", icon: LayoutDashboard },
  { name: "My Beats", path: "/producer/beats", icon: Music },
  { name: "Upload", path: "/producer/upload", icon: Upload },
  { name: "Sales", path: "/producer/sales", icon: DollarSign },
  { name: "Settings", path: "/producer/settings", icon: Settings },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={cn(
          "h-screen bg-card border-r flex-shrink-0 overflow-hidden transition-all duration-300 flex flex-col z-50",
          isOpen ? "w-64" : "w-0",
          isMobile ? "fixed left-0" : "sticky top-0"
        )}
      >
        {/* Sidebar content */}
        <div className="p-4 flex justify-between items-center border-b">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Music className="h-6 w-6 text-primary" />
            {isOpen && <span>OrderSOUNDS</span>}
          </Link>
        </div>
        
        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* Main Navigation Links */}
          <div className="px-3 mb-6">
            <div className="text-xs uppercase text-muted-foreground px-2 mb-2">
              {isOpen ? "Discover" : ""}
            </div>
            <nav>
              {sidebarLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "flex items-center gap-3 px-2 py-2 my-1 rounded-md text-sm",
                    isActive(link.path) 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <link.icon size={20} />
                  {isOpen && <span>{link.name}</span>}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Library Section */}
          <div className="px-3 mb-6">
            <div className="text-xs uppercase text-muted-foreground px-2 mb-2">
              {isOpen ? "Library" : ""}
            </div>
            <nav>
              <Link
                to="/purchased"
                className={cn(
                  "flex items-center gap-3 px-2 py-2 my-1 rounded-md text-sm",
                  isActive("/purchased") 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Music size={20} />
                {isOpen && <span>Purchased</span>}
              </Link>
              <Link
                to="/favorites"
                className={cn(
                  "flex items-center gap-3 px-2 py-2 my-1 rounded-md text-sm",
                  isActive("/favorites") 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Heart size={20} />
                {isOpen && <span>Favorites</span>}
              </Link>
              <Link
                to="/my-playlists"
                className={cn(
                  "flex items-center gap-3 px-2 py-2 my-1 rounded-md text-sm",
                  isActive("/my-playlists") 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List size={20} />
                {isOpen && <span>Playlists</span>}
              </Link>
            </nav>
          </div>
          
          {/* Producer Section (conditional) */}
          {user?.role === "producer" && (
            <div className="px-3 mb-6">
              <div className="text-xs uppercase text-muted-foreground px-2 mb-2">
                {isOpen ? "Producer" : ""}
              </div>
              <nav>
                {producerLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={cn(
                      "flex items-center gap-3 px-2 py-2 my-1 rounded-md text-sm",
                      isActive(link.path) 
                        ? "bg-primary/10 text-primary font-medium" 
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <link.icon size={20} />
                    {isOpen && <span>{link.name}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          )}
        </div>
        
        {/* User section at bottom */}
        {user ? (
          <div className="p-4 border-t mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center justify-start p-2 h-auto">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  {isOpen && (
                    <>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium leading-none">{user.name || "User"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <MoreHorizontal size={18} className="text-muted-foreground" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="p-4 border-t mt-auto flex flex-col gap-2">
            {isOpen ? (
              <>
                <Button asChild size="sm" className="w-full">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to="/signup">Sign up</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="icon" variant="ghost">
                <Link to="/login">
                  <User size={20} />
                </Link>
              </Button>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
