
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { SidebarContentSections } from './SidebarContentSections';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useProducers } from '@/hooks/useProducers';
import { User } from '@/types';

interface UnifiedSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
  user?: User | null;
  handleSignOut?: () => void;
  isCollapsed?: boolean;
  toggleCollapsed?: () => void;
  isMobile?: boolean;
}

export const UnifiedSidebar = ({
  isOpen,
  setIsOpen,
  user,
  handleSignOut,
  isCollapsed,
  toggleCollapsed,
  isMobile
}: UnifiedSidebarProps) => {
  // If no user is passed, use the user from the AuthContext
  const authContext = useAuth();
  const navigate = useNavigate();
  const currentUser = user || authContext.user;
  const logoutFn = handleSignOut || authContext.logout;
  const { prefetchProducers } = useProducers();
  
  // Handle mouseEnter events on navigation links
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
