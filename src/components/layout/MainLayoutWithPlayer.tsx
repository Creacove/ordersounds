
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
  activeTab?: string;
  currentPath?: string;
  hideSidebar?: boolean;
}

export function MainLayoutWithPlayer({ children, activeTab, currentPath, hideSidebar }: MainLayoutWithPlayerProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();

  // Listen for sidebar open/close events
  useEffect(() => {
    const handleSidebarChange = (event: CustomEvent) => {
      setSidebarVisible(event.detail.isOpen);
    };

    window.addEventListener('sidebarChange' as any, handleSidebarChange);
    return () => {
      window.removeEventListener('sidebarChange' as any, handleSidebarChange);
    };
  }, []);

  return (
    <div className="flex min-h-screen">
      {!hideSidebar && (
        <Sidebar 
          activeTab={activeTab} 
          currentPath={currentPath} 
          onCollapsedChange={setIsCollapsed}
        />
      )}
      <div className={`flex flex-col flex-1 transition-all duration-300 ${!isMobile && !hideSidebar ? (isCollapsed ? "md:ml-[80px]" : "md:ml-[240px]") : ""}`}>
        <Topbar sidebarVisible={!isMobile && sidebarVisible && !hideSidebar} />
        <main className="flex-1">
          <div className="w-full flex flex-col">
            {children}
          </div>
        </main>
        <PersistentPlayer />
      </div>
    </div>
  );
}
