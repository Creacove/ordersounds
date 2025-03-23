
import React, { useState, useEffect } from "react";
import { Topbar } from "./Topbar";
import Sidebar from "./Sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children, hideSidebar = false }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="h-screen flex flex-col">
      <Topbar setSidebarOpen={setSidebarOpen} hideLogo={!hideSidebar} />
      
      <div className="flex-1 flex overflow-hidden">
        {!hideSidebar && <Sidebar />}
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
