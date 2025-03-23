
import { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
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
  PanelLeft, 
  Music,
  LayoutDashboard,
  Upload,
  DollarSign,
  Settings,
  Disc,
  Grip,
  ShoppingCart,
  User,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

export function Sidebar() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const { isPlaying, currentBeat } = usePlayer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("");

  useEffect(() => {
    if (!isMobile) {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
    
    // Set active bottom tab based on current path
    const path = location.pathname;
    if (path === "/") setActiveBottomTab("home");
    else if (path === "/genres" || path === "/discover") setActiveBottomTab("discover");
    else if (path === "/trending") setActiveBottomTab("trending");
    else if (path === "/favorites") setActiveBottomTab("favorites");
    else if (path === "/cart") setActiveBottomTab("cart");
    else if (path.includes("/my-playlists") || path.includes("/purchased")) setActiveBottomTab("more");
    else if (path.includes("/producer/")) setActiveBottomTab("producer");
    else setActiveBottomTab("");
  }, [location.pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  // Buyer navigation links
  const buyerLinks = [
    { 
      title: "Explore Beats", 
      items: [
        { title: "Home", icon: Home, href: "/" },
        { title: "Trending", icon: TrendingUp, href: "/trending" },
        { title: "New", icon: Clock, href: "/new" },
        { title: "Playlists", icon: List, href: "/playlists" },
        { title: "Genres", icon: Disc, href: "/genres" },
        { title: "Producers", icon: Grip, href: "/producers" },
        { title: "Charts", icon: LayoutGrid, href: "/charts" },
      ]
    },
    { 
      title: "Library", 
      items: [
        { title: "Favorites", icon: Heart, href: "/favorites" },
        { title: "My Playlists", icon: LayoutGrid, href: "/my-playlists" },
        { title: "Purchased", icon: Music, href: "/purchased" },
        { title: "Orders", icon: Library, href: "/orders" },
      ]
    }
  ];

  // Producer navigation links
  const producerLinks = [
    { 
      title: "Producer", 
      items: [
        { title: "Dashboard", icon: LayoutDashboard, href: "/producer/dashboard" },
        { title: "My Beats", icon: Music, href: "/producer/beats" },
        { title: "Upload Beat", icon: Upload, href: "/producer/upload" },
        { title: "Royalty Splits", icon: DollarSign, href: "/producer/royalties" },
        { title: "Settings", icon: Settings, href: "/producer/settings" },
      ]
    }
  ];

  // Choose navigation based on user role or include both if user is producer
  const navigationLinks = user?.role === "producer" 
    ? [...producerLinks, ...buyerLinks]  // If producer, show both producer and buyer links
    : buyerLinks;  // If not producer (or not logged in), show only buyer links

  const SidebarItem = ({ item }: { item: { title: string; icon: React.ElementType; href: string } }) => {
    const isActive = location.pathname === item.href;
    const Icon = item.icon;

    return (
      <TooltipProvider delayDuration={isCollapsed ? 100 : 1000}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                "hover:bg-purple-500/20 hover:text-purple-500",
                isActive 
                  ? "bg-purple-500/10 text-purple-500 font-medium" 
                  : "text-muted-foreground",
                isCollapsed ? "justify-center" : ""
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={18} className={isActive ? "text-purple-500" : ""} />
              {!isCollapsed && <span>{item.title}</span>}
            </NavLink>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              {item.title}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Desktop sidebar
  const DesktopSidebar = () => (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
        {/* Section for each navigation group */}
        {navigationLinks.map((section, index) => (
          <div key={index} className="mb-6">
            {!isCollapsed && (
              <h2 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/60">
                {section.title}
              </h2>
            )}
            <nav className="flex flex-col gap-1">
              {section.items.map((item, idx) => (
                <SidebarItem key={idx} item={item} />
              ))}
            </nav>
          </div>
        ))}
      </div>

      {/* Collapse button */}
      <div className="flex items-center justify-center p-4 border-t">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full hover:bg-purple-500/10 hover:text-purple-500 transition-colors"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </aside>
  );

  // Mobile bottom navigation with all essential options
  const MobileBottomNav = () => {
    // Primary mobile menu items that should always be visible
    let mobileMenuItems = [
      { icon: <Home size={20} />, label: "Home", to: "/", id: "home" },
      { icon: <Disc size={20} />, label: "Discover", to: "/genres", id: "discover" },
      { icon: <TrendingUp size={20} />, label: "Trending", to: "/trending", id: "trending" },
      { icon: <Heart size={20} />, label: "Favorites", to: "/favorites", id: "favorites" },
      { icon: <ShoppingCart size={20} />, label: "Cart", to: "/cart", id: "cart", badge: itemCount > 0 ? itemCount : null },
    ];
    
    // Add producer tab for producer users
    if (user?.role === "producer") {
      mobileMenuItems.push({ 
        icon: <LayoutDashboard size={20} />, 
        label: "Producer", 
        to: "/producer/dashboard", 
        id: "producer" 
      });
    }
    
    // Always add More tab as the last item
    mobileMenuItems.push({ 
      icon: <MoreHorizontal size={20} />, 
      label: "More", 
      to: "#", 
      id: "more", 
      action: () => setIsOpen(true) 
    });

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-sidebar border-t border-sidebar-border py-1">
        <div className="flex justify-around">
          {mobileMenuItems.map((item, idx) => {
            // For the "More" button, use a button instead of a link
            const isActive = activeBottomTab === item.id;
            
            if (item.action) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-2 relative",
                    isActive ? "text-purple-500" : "text-muted-foreground"
                  )}
                >
                  <div className={cn(
                    "relative p-1.5 rounded-full transition-colors",
                    isActive ? "bg-purple-500/20" : ""
                  )}>
                    {item.icon}
                  </div>
                  <span className={cn(
                    "text-xs mt-0.5",
                    isActive ? "text-purple-500 font-medium" : ""
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            }
            
            return (
              <Link
                key={idx}
                to={item.to}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 relative",
                  isActive ? "text-purple-500" : "text-muted-foreground"
                )}
              >
                <div className={cn(
                  "relative p-1.5 rounded-full transition-colors",
                  isActive ? "bg-purple-500/20" : ""
                )}>
                  {item.icon}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className={cn(
                  "text-xs mt-0.5",
                  isActive ? "text-purple-500 font-medium" : ""
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile sidebar (slides in from left) */}
      {isMobile && (
        <>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out w-[80%] max-w-[300px]",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-medium">OrderSOUNDS Menu</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsOpen(false)}
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
            
            <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
              {navigationLinks.map((section, index) => (
                <div key={index} className="mb-6">
                  <h2 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/60">
                    {section.title}
                  </h2>
                  <nav className="flex flex-col gap-1">
                    {section.items.map((item, idx) => (
                      <NavLink
                        key={idx}
                        to={item.href}
                        className={({ isActive }) => cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-purple-500",
                          isActive 
                            ? "bg-purple-500/10 text-purple-500 font-medium" 
                            : "text-muted-foreground"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        <item.icon size={18} />
                        <span>{item.title}</span>
                      </NavLink>
                    ))}
                  </nav>
                </div>
              ))}
              
              {/* User section */}
              {user && (
                <div className="mt-2 border-t pt-4">
                  <h2 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/60">
                    User
                  </h2>
                  <nav className="flex flex-col gap-1">
                    <NavLink
                      to={`/buyer/${user.id}`}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        "hover:bg-purple-500/20 hover:text-purple-500",
                        isActive 
                          ? "bg-purple-500/10 text-purple-500 font-medium" 
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <User size={18} />
                      <span>Profile</span>
                    </NavLink>
                    <NavLink
                      to="/settings"
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                        "hover:bg-purple-500/20 hover:text-purple-500",
                        isActive 
                          ? "bg-purple-500/10 text-purple-500 font-medium" 
                          : "text-muted-foreground"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings size={18} />
                      <span>Settings</span>
                    </NavLink>
                  </nav>
                </div>
              )}
            </div>
          </aside>
          
          {/* Bottom navigation for mobile */}
          <MobileBottomNav />
        </>
      )}

      {/* Desktop sidebar */}
      {!isMobile && <DesktopSidebar />}
    </>
  );
}
