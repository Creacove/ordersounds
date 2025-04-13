
import React, { useState } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarContentSections } from './SidebarContentSections';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProducers } from '@/hooks/useProducers';

export const UnifiedSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { prefetchProducers } = useProducers();
  
  // Add this function to handle mouseEnter events on navigation links
  const handleMouseEnterRoute = (routePath: string) => {
    // Prefetch data based on the route being hovered
    if (routePath === '/producers') {
      prefetchProducers();
    }
    // Add other route prefetching as needed
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      <ScrollArea className="flex-1">
        <SidebarContentSections 
          onRouteHover={handleMouseEnterRoute} 
        />
      </ScrollArea>
    </div>
  );
};
