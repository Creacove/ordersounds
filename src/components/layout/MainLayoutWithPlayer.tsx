
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
}

export function MainLayoutWithPlayer({ children, className }: MainLayoutWithPlayerProps) {
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
        <Sidebar />
        
        <main className={cn(
          "flex-1 transition-all duration-300 w-full", 
          // Adjust left padding to prevent content overlap
          isMobile ? "pl-0" : "pl-[70px] lg:pl-[240px]",
          // Add extra bottom padding when on mobile with player
          hasPlayer && isMobile ? "pb-28" : hasPlayer ? "pb-20" : isMobile ? "pb-20" : "",
          "animate-fade-in"
        )}>
          {children}
        </main>
      </div>
      
      <PersistentPlayer />
    </div>
  );
}
