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
  Music,
  LayoutDashboard,
  DollarSign,
  Settings,
  Disc,
  ShoppingCart,
  User,
  MoreHorizontal,
  LogOut,
  Search,
  BookOpen,
  PlaySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileMenuItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  id: string;
  badge?: number | null;
  action?: () => void;
}

interface SidebarProps {
  activeTab?: string;
  currentPath?: string;
}

function Sidebar({ activeTab, currentPath }: SidebarProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const { isPlaying, currentBeat } = usePlayer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState(activeTab || "");

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

    if (activeTab) {
      setActiveBottomTab(activeTab);
    } else {
      const path = currentPath || location.pathname;

      if (path === "/") setActiveBottomTab("home");
      else if (path === "/genres" || path === "/discover") setActiveBottomTab("discover");
      else if (path === "/trending") setActiveBottomTab("trending");
      else if (path === "/playlists") setActiveBottomTab("playlists");
      else if (path === "/cart") setActiveBottomTab("cart");
      else if (path === "/producer/dashboard") setActiveBottomTab("producer");
      else if (path === "/producer/beats") setActiveBottomTab("beats");
      else if (path === "/producer/royalties") setActiveBottomTab("royalties");
      else if (path === "/library" || path === "/purchased" || path === "/my-playlists") setActiveBottomTab("library");
      else setActiveBottomTab("");
    }
  }, [location.pathname, isMobile, activeTab, currentPath]);

  const handleSignOut = () => {
    logout && logout();
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setIsOpen(!isOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const getSidebarContent = () => {
    const sections = [];

    if (user?.role === "producer") {
      sections.push({
        title: "Producer",
        items: [
          { icon: LayoutDashboard, title: "Dashboard", href: "/producer/dashboard" },
          { icon: Music, title: "My Beats", href: "/producer/beats" },
          { icon: DollarSign, title: "Royalty Splits", href: "/producer/royalties" },
          { icon: Settings, title: "Settings", href: "/settings" },
        ]
      });

      sections.push({
        title: "Marketplace",
        items: [
          { icon: Home, title: "Explore", href: "/" },
          { icon: TrendingUp, title: "Trending", href: "/trending" },
          { icon: Heart, title: "Favorites", href: "/favorites" },
          { icon: ShoppingCart, title: "Cart", href: "/cart" },
        ]
      });
    } else {
      sections.push({ 
        title: "Explore Beats", 
        items: [
          { icon: Home, title: "Home", href: "/" },
          { icon: TrendingUp, title: "Trending", href: "/trending" },
          { icon: Clock, title: "New", href: "/new" },
          { icon: List, title: "Playlists", href: "/playlists" },
          { icon: Disc, title: "Genres", href: "/genres" },
          { icon: Search, title: "Search", href: "/search" },
        ]
      });

      sections.push({ 
        title: "Library", 
        items: [
          { icon: Heart, title: "Favorites", href: "/favorites" },
          { icon: LayoutGrid, title: "My Playlists", href: "/my-playlists" },
          { icon: Music, title: "Purchased", href: "/purchased" },
        ]
      });
    }

    if (user) {
      sections.push({
        title: "Account",
        items: [
          { icon: User, title: "Profile", href: user.role === "producer" ? `/producer/${user.id}` : `/buyer/${user.id}` },
          { icon: Settings, title: "Settings", href: "/settings" },
          { icon: LogOut, title: "Sign Out", href: "#", onClick: handleSignOut },
        ]
      });
    }

    return sections;
  };

  const MobileBottomNav = () => {
    let mobileMenuItems: MobileMenuItem[] = [];

    if (user?.role === "producer") {
      mobileMenuItems = [
        { icon: <LayoutDashboard size={20} />, label: "Dashboard", to: "/producer/dashboard", id: "producer" },
        { icon: <Music size={20} />, label: "My Beats", to: "/producer/beats", id: "beats" },
        { icon: <DollarSign size={20} />, label: "Royalties", to: "/producer/royalties", id: "royalties" },
        { icon: <MoreHorizontal size={20} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
      ];
    } else {
      mobileMenuItems = [
        { icon: <Home size={20} />, label: "Home", to: "/", id: "home" },
        { icon: <BookOpen size={20} />, label: "Library", to: "/library", id: "library" },
        { icon: <PlaySquare size={20} />, label: "Playlists", to: "/playlists", id: "playlists" },
        { icon: <ShoppingCart size={20} />, label: "Cart", to: "/cart", id: "cart", badge: itemCount > 0 ? itemCount : null },
        { icon: <MoreHorizontal size={20} />, label: "More", to: "#", id: "more", action: () => setIsOpen(true) },
      ];
    }

    return (
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e0e] border-t border-[#272727] py-1">
        <div className="flex justify-around">
          {mobileMenuItems.map((item, idx) => {
            const isActive = activeBottomTab === item.id;
            const isLibraryRoute =
              item.id === "library" &&
              (location.pathname === "/library" ||
                location.pathname === "/purchased" ||
                location.pathname === "/my-playlists");

            if (item.action) {
              return (
                <button
                  key={idx}
                  onClick={item.action}
                  className={cn(
                    "flex flex-col items-center justify-center py-1 px-2 relative",
                    isActive ? "text-purple-500" : "text-gray-400"
                  )}
                >
                  <div
                    className={cn(
                      "relative p-1.5 rounded-full transition-colors",
                      isActive ? "bg-purple-500/20" : ""
                    )}
                  >
                    {item.icon}
                  </div>
                  <span
                    className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-purple-500 font-medium" : ""
                    )}
                  >
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
                  (isActive || isLibraryRoute) ? "text-purple-500" : "text-gray-400"
                )}
                onClick={() => setActiveBottomTab(item.id)}
              >
                <div
                  className={cn(
                    "relative p-1.5 rounded-full transition-colors",
                    (isActive || isLibraryRoute) ? "bg-purple-500/20" : ""
                  )}
                >
                  {item.icon}
                  {item.badge && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
                    >
                      {item.badge > 9 ? "9+" : item.badge}
                    </Badge>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-0.5",
                    (isActive || isLibraryRoute) ? "text-purple-500 font-medium" : ""
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  };

  const DesktopSidebar = () => {
    return (
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[#0e0e0e] text-white",
          isCollapsed ? "w-[70px]" : "w-[240px]"
        )}
      >
        <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
          {getSidebarContent().map((section, index) => (
            <div key={index} className="mb-6">
              {!isCollapsed && (
                <h2 className="px-3 mb-2 text-xs font-medium uppercase text-gray-400">
                  {section.title}
                </h2>
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map((item, idx) => {
                  if (item.onClick) {
                    const isActive = location.pathname === item.href;
                    return (
                      <TooltipProvider key={idx} delayDuration={isCollapsed ? 100 : 1000}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={item.onClick}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                                "hover:bg-purple-500/20 hover:text-white",
                                isActive
                                  ? "bg-[#181818] text-purple-400 border-r-4 border-purple-500 font-medium"
                                  : "text-gray-400",
                                isCollapsed ? "justify-center" : ""
                              )}
                            >
                              <item.icon
                                size={18}
                                className={cn(
                                  "transition-colors",
                                  isActive ? "text-purple-400" : "text-gray-400"
                                )}
                              />
                              {!isCollapsed && <span>{item.title}</span>}
                            </button>
                          </TooltipTrigger>
                          {isCollapsed && (
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    );
                  }
                  
                  return (
                    <TooltipProvider key={idx} delayDuration={isCollapsed ? 100 : 1000}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <NavLink
                            to={item.href}
                            className={({ isActive }) =>
                              cn(
                                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                                "hover:bg-purple-500/20 hover:text-white",
                                isActive
                                  ? "bg-[#181818] text-purple-400 border-r-4 border-purple-500 font-medium"
                                  : "text-gray-400",
                                isCollapsed ? "justify-center" : ""
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <item.icon
                                  size={18}
                                  className={cn(
                                    "transition-colors",
                                    isActive ? "text-purple-400" : "text-gray-400"
                                  )}
                                />
                                {!isCollapsed && <span>{item.title}</span>}
                              </>
                            )}
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
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center p-4 border-t border-[#272727]">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full hover:bg-purple-500/20 hover:text-purple-500 transition-colors"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </aside>
    );
  };

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isMobile && (
        <>
          <aside
            className={cn(
              "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out w-[80%] max-w-[300px]",
              "bg-[#0e0e0e] text-white",
              isOpen ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#272727]">
              <h2 className="font-medium">
                {user?.role === "producer" ? "Producer Menu" : "OrderSOUNDS Menu"}
              </h2>
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
              {getSidebarContent().map((section, index) => (
                <div key={index} className="mb-6">
                  <h2 className="px-3 mb-2 text-xs font-medium uppercase text-gray-400">
                    {section.title}
                  </h2>
                  <nav className="flex flex-col gap-1">
                    {section.items.map((item, idx) => {
                      const isActive = location.pathname === item.href;
                      return item.onClick ? (
                        <button
                          key={idx}
                          onClick={() => {
                            item.onClick && item.onClick();
                            setIsOpen(false);
                          }}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                            "hover:bg-purple-500/20 hover:text-white",
                            isActive
                              ? "bg-[#181818] text-purple-400 border-r-4 border-purple-500 font-medium"
                              : "text-gray-400"
                          )}
                        >
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </button>
                      ) : (
                        <NavLink
                          key={idx}
                          to={item.href}
                          onClick={() => setIsOpen(false)}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                              "hover:bg-purple-500/20 hover:text-white",
                              isActive
                                ? "bg-[#181818] text-purple-400 border-r-4 border-purple-500 font-medium"
                                : "text-gray-400"
                            )
                          }
                        >
                          <item.icon size={18} />
                          <span>{item.title}</span>
                        </NavLink>
                      );
                    })}
                  </nav>
                </div>
              ))}
            </div>
          </aside>
          
          <MobileBottomNav />
        </>
      )}

      {!isMobile && <DesktopSidebar />}
    </>
  );
}

export { Sidebar };
