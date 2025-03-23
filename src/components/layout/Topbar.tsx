
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Search, 
  ShoppingCart, 
  Bell, 
  User,
  Menu,
  X,
  LogOut,
  Settings,
  Heart,
  Music2,
  MessageSquare,
  ChevronDown,
  Flame,
  Headphones
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function Topbar() {
  const { user, logout, currency, setCurrency } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { itemCount } = useCart();
  const isMobile = useIsMobile();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const handleSignOut = async () => {
    await logout();
    navigate("/login");
  };
  
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };
  
  const toggleCurrency = (newCurrency: 'USD' | 'NGN') => {
    setCurrency(newCurrency);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header 
      className={cn(
        "sticky top-0 z-30 w-full transition-all duration-200",
        isScrolled ? "bg-background/90 backdrop-blur-md border-b shadow-sm" : "bg-transparent"
      )}
    >
      <div className="container flex items-center justify-between h-16 py-2">
        {/* Logo */}
        <div className="flex items-center gap-2">          
          <Link to="/" className="flex items-center gap-2">
            <Headphones size={24} className="text-purple-600" />
            <span className="font-heading font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">OrderSOUNDS</span>
          </Link>

          {/* Desktop Navigation Menu - Simplified */}
          {!isMobile && (
            <NavigationMenu className="ml-4 hidden md:flex">
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/") ? "bg-accent text-accent-foreground" : ""
                    )}
                    href="/"
                  >
                    Home
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/trending") ? "bg-accent text-accent-foreground" : ""
                    )}
                    href="/trending"
                  >
                    Trending
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/playlists") ? "bg-accent text-accent-foreground" : ""
                    )}
                    href="/playlists"
                  >
                    Playlists
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isActive("/search") ? "bg-accent text-accent-foreground" : ""
                    )}
                    href="/search"
                  >
                    Search
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>
        
        {/* Search, Cart, User - Simplified */}
        <div className="flex items-center gap-3">
          {/* Currency toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-full px-3"
              >
                {currency === "USD" ? "$" : "₦"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Currency</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toggleCurrency("USD")}>
                <span className={cn(currency === "USD" ? "font-bold" : "")}>USD ($)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleCurrency("NGN")}>
                <span className={cn(currency === "NGN" ? "font-bold" : "")}>NGN (₦)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Search - redirects to search page */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => navigate("/search")}
          >
            <Search size={18} />
            <span className="sr-only">Search</span>
          </Button>
          
          {/* Cart - show for all users */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-8 w-8"
            onClick={() => navigate("/cart")}
          >
            <ShoppingCart size={18} />
            <span className="sr-only">Cart</span>
            {itemCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </Badge>
            )}
          </Button>
          
          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/buyer/${user.id}`)}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/favorites")}>
                  <Heart className="mr-2 h-4 w-4" />
                  <span>Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/purchased")}>
                  <Music2 className="mr-2 h-4 w-4" />
                  <span>My Purchases</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                {user.role === "producer" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/producer/dashboard")}>
                      <span className="mr-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">Producer</span>
                      <span>Switch to Producer View</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="font-medium"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
