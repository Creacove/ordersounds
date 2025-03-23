
import React, { useState, useEffect } from 'react';
import { Topbar } from './Topbar';
import Sidebar from './Sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { PersistentPlayer } from '@/components/player/PersistentPlayer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayoutWithPlayer: React.FC<MainLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar setSidebarOpen={setSidebarOpen} />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>

      <PersistentPlayer />
    </div>
  );
};
