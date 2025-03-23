import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Bell, User, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface TopbarProps {
  setSidebarOpen: (value: boolean) => void;
  hideLogo?: boolean;
}

export const Topbar = ({ setSidebarOpen, hideLogo = false }: TopbarProps) => {
  const { user } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isMobileMenuOpen = isMobile;

  // Handler for mobile menu
  const toggleMobileMenu = () => {
    setSidebarOpen(!isMobileMenuOpen);
  };

  // Navigate to search page
  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="container flex items-center justify-between h-16 px-4">
        {/* Left section - Mobile menu button and Logo */}
        <div className="flex items-center gap-2">
          {isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
              <span className="sr-only">Menu</span>
            </Button>
          )}
          {!hideLogo && (
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Headphones className="h-6 w-6 text-primary" />
              <span className="hidden sm:inline">OrderSOUNDS</span>
            </Link>
          )}
        </div>

        {/* Center section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 text-muted-foreground" 
            onClick={handleSearchClick}
          >
            <Search size={18} />
            <span>Search beats, producers...</span>
          </Button>
        </div>

        {/* Right section - Cart, notifications, user */}
        <div className="flex items-center gap-2">
          {/* Search button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={handleSearchClick}
          >
            <Search size={20} />
          </Button>
          
          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart">
              <ShoppingCart size={20} />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full w-4 h-4 text-xs flex items-center justify-center">
                  {cartItems.length}
                </span>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
          
          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/purchased">My Purchases</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/favorites">Favorites</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/logout">Logout</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
