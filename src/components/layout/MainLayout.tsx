
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  currentPath?: string;
  hideSidebar?: boolean;
}

export function MainLayout({ children, activeTab, currentPath, hideSidebar }: MainLayoutProps) {
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

  // Check if the current path is an auth page
  const isAuthPage = currentPath === "/login" || currentPath === "/signup";

  return (
    <div className="flex min-h-screen w-full">
      {!hideSidebar && (
        <Sidebar 
          activeTab={activeTab} 
          currentPath={currentPath} 
          onCollapsedChange={setIsCollapsed}
        />
      )}
      <div className={`flex flex-col flex-1 w-full transition-all duration-300 ${!isMobile && !hideSidebar ? (isCollapsed ? "md:ml-[80px]" : "md:ml-[240px]") : ""}`}>
        {/* Only show topbar if not explicitly hidden or if it's not an auth page with hideSidebar */}
        {!(isAuthPage && hideSidebar) && (
          <Topbar />
        )}
        <main className="flex-1 w-full pb-32 md:pb-24">
          <div className="w-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
