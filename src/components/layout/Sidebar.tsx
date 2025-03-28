
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBottomNav } from "./MobileBottomNav";
import { MobileSidebar } from "./MobileSidebar";
import { DesktopSidebar } from "./DesktopSidebar";
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
    return getSidebarSections(user, handleSignOut);
  };

  return (
    <>
      {isMobile && (
        <>
          <MobileSidebar 
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            user={user}
            handleSignOut={handleSignOut}
            getSidebarContent={getSidebarContent}
          />
          
          <MobileBottomNav 
            activeBottomTab={activeBottomTab}
            user={user}
            itemCount={itemCount}
            setIsOpen={setIsOpen}
            setActiveBottomTab={setActiveBottomTab}
          />
        </>
      )}

      {!isMobile && (
        <DesktopSidebar 
          isCollapsed={isCollapsed}
          toggleSidebar={toggleSidebar}
          getSidebarContent={getSidebarContent}
          location={location}
        />
      )}
    </>
  );
}

export { Sidebar };
