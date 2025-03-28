
import React, { PropsWithChildren, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "react-router-dom";

interface MainLayoutWithPlayerProps extends PropsWithChildren {
  className?: string;
  activeTab?: string; // Add this property to fix the TypeScript error
  currentPath?: string; // Making this optional as well for consistency
}

export function MainLayoutWithPlayer({ 
  children, 
  className,
  activeTab,
  currentPath 
}: MainLayoutWithPlayerProps) {
  const { currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  const hasPlayer = !!currentBeat;
  const location = useLocation();
  
  // Smooth scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);
  
  return (
    <div className={cn(
      "flex min-h-screen flex-col w-full",
      hasPlayer && isMobile ? "pb-32" : hasPlayer ? "pb-24" : "",
      className
    )}>
      <Topbar />
      
      <div className="flex flex-1">
        <Sidebar activeTab={activeTab} currentPath={currentPath} />
        
        <main className={cn(
          "flex-1 transition-all duration-300 w-full animate-fade-in", 
          // Adjust left padding to prevent content overlap
          isMobile ? "pl-0" : "pl-[70px] lg:pl-[240px]",
          // Add consistently sized bottom padding for mobile
          isMobile ? 
            hasPlayer ? "pb-32 mobile-content-padding" : "pb-20 mobile-content-padding" : 
            hasPlayer ? "pb-24" : ""
        )}>
          {children}
        </main>
      </div>
      
      <PersistentPlayer />
    </div>
  );
}
