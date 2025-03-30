
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, AlignJustify } from "lucide-react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
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
        isCollapsed={!isMobile ? isCollapsed : false}
        toggleCollapsed={!isMobile ? toggleCollapsed : undefined}
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
      {!isMobile && !isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-full bg-sidebar hover:bg-sidebar-accent transition-colors"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}

export { Sidebar };
