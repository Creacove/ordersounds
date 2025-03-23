
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
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
  Grip
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setIsCollapsed(isMobileView);
    };

    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
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

  // Choose navigation based on user role
  const navigationLinks = user?.role === "producer" ? producerLinks : buyerLinks;

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
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground",
                isCollapsed ? "justify-center" : ""
              )}
            >
              <Icon size={18} />
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

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile toggle button */}
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="fixed left-4 top-20 z-50 rounded-full bg-primary text-primary-foreground shadow-md md:hidden"
          onClick={toggleSidebar}
        >
          <PanelLeft size={18} />
        </Button>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-sidebar transition-all duration-300 ease-in-out",
          isMobile
            ? isOpen
              ? "translate-x-0"
              : "-translate-x-full"
            : isCollapsed
            ? "w-[70px]"
            : "w-[240px]"
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
        {!isMobile && (
          <div className="flex items-center justify-center p-4 border-t">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full"
              onClick={toggleSidebar}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
