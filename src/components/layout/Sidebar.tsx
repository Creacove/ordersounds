
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSidebar } from "./MobileSidebar";
import { getSidebarSections } from "./SidebarContentSections";

interface SidebarProps {
  activeTab?: string;
  currentPath?: string;
}

function Sidebar({ activeTab, currentPath }: SidebarProps) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const { isPlaying, currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState(activeTab || "");

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
    setIsOpen(!isOpen);
  };

  const getSidebarContent = () => {
    return getSidebarSections(user, handleSignOut);
  };

  return (
    <>
      {/* Show mobile sidebar for all device sizes */}
      <MobileSidebar 
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        user={user}
        handleSignOut={handleSignOut}
        getSidebarContent={getSidebarContent}
      />
      
      {/* Show bottom nav only on mobile devices */}
      {isMobile && (
        <MobileBottomNav 
          activeBottomTab={activeBottomTab}
          user={user}
          itemCount={itemCount}
          setIsOpen={setIsOpen}
          setActiveBottomTab={setActiveBottomTab}
        />
      )}

      {/* Desktop toggle button */}
      {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-sidebar hover:bg-sidebar-accent transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}
    </>
  );
}

export { Sidebar };
