
import React, { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutWithPlayerProps extends PropsWithChildren {
  className?: string;
}

export function MainLayoutWithPlayer({ children, className }: MainLayoutWithPlayerProps) {
  const { currentBeat } = usePlayer();
  const isMobile = useIsMobile();
  const hasPlayer = !!currentBeat;
  
  return (
    <div className={cn(
      "flex min-h-screen flex-col w-full",
      hasPlayer && isMobile ? "has-player pb-32" : "",
      className
    )}>
      <Topbar />
      
      <div className="flex flex-1">
        <Sidebar />
        
        <main className={cn(
          "flex-1 pl-0 md:pl-[70px] transition-all duration-300", 
          isMobile ? "" : "lg:pl-[240px]",
          hasPlayer && isMobile ? "pb-24" : ""
        )}>
          {children}
        </main>
      </div>
      
      <PersistentPlayer />
    </div>
  );
}
