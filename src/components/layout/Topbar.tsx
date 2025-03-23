
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Bell, LogOut, Settings, Heart, MessageSquare } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { user, logout, currency, setCurrency } = useAuth();
  const { itemCount } = useCart();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search submission
    console.log("Searching for:", searchQuery);
  };

  const toggleCurrency = () => {
    setCurrency(currency === 'NGN' ? 'USD' : 'NGN');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="flex h-16 items-center px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mr-4">
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-white">
                <path 
                  d="M12 3c-1.83 0-3.5.62-4.83 1.65L12 9.48l4.83-4.83C15.5 3.62 13.83 3 12 3zm0 18c1.83 0 3.5-.62 4.83-1.65L12 14.52l-4.83 4.83C8.5 20.38 10.17 21 12 21z" 
                  fill="currentColor"
                />
                <path 
                  d="M3 12c0 1.83.62 3.5 1.65 4.83L9.48 12l-4.83-4.83C3.62 8.5 3 10.17 3 12zm18 0c0-1.83-.62-3.5-1.65-4.83L14.52 12l4.83 4.83C20.38 15.5 21 13.83 21 12z" 
                  fill="currentColor"
                  opacity="0.7"
                />
              </svg>
            </div>
            <span className="text-lg font-semibold">Creacove</span>
          </div>
        </Link>

        {/* Currency Switch */}
        <button 
          className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-sm font-medium transition-colors mr-4"
          onClick={toggleCurrency}
        >
          <span className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
            {currency}
          </span>
        </button>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search beat, producer, playlist or #tag"
              className="w-full py-2 pl-10 pr-4 rounded-full bg-muted text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        <div className="flex items-center gap-2 md:gap-4 ml-auto">
          {/* Cart Icon */}
          {user && (
            <Link to="/cart" className="relative flex items-center">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}

          {/* Auth Buttons or User Menu */}
          {!user ? (
            <div className="flex items-center gap-2">
              <Link to="/signup">
                <Button variant="ghost" size="sm">Sign up</Button>
              </Link>
              <Link to="/login">
                <Button size="sm" className="bg-primary">Login</Button>
              </Link>
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className={cn(
                      "h-8 w-8 rounded-full bg-primary flex items-center justify-center",
                      "text-sm font-medium text-primary-foreground"
                    )}>
                      {user.name.charAt(0)}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notifications" className="cursor-pointer flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="cursor-pointer flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="cursor-pointer flex items-center">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    <span>Contact Us</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
