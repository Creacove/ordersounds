import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
  activeTab?: string;
  currentPath?: string;
}

// We need to add the sidebarVisible state to coordinate between the sidebar and topbar
export function MainLayoutWithPlayer({ children, activeTab, currentPath }: MainLayoutWithPlayerProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
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
    <div className="flex min-h-screen flex-col">
      <Topbar sidebarVisible={sidebarVisible && !isMobile} />
      <Sidebar activeTab={activeTab} currentPath={currentPath} />
      <main className="flex-1">
        <div className="w-full flex flex-col">
          {children}
        </div>
      </main>
      <PersistentPlayer />
    </div>
  );
}
