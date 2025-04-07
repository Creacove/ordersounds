
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Headphones, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface UnifiedSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  handleSignOut: () => void;
  getSidebarContent: () => any[];
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  isMobile: boolean;
}

export function UnifiedSidebar({ 
  isOpen, 
  setIsOpen, 
  user, 
  handleSignOut, 
  getSidebarContent,
  isCollapsed,
  toggleCollapsed,
  isMobile
}: UnifiedSidebarProps) {
  const navigate = useNavigate();
  const { isProducerInactive } = useAuth();
  
  // Handle navigation with inactive producer check
  const handleNavigation = (href: string, onClick?: () => void) => {
    // If there's a custom onClick handler, call it
    if (onClick) {
      onClick();
      if (isMobile) setIsOpen(false);
      return;
    }
    
    // If producer is inactive and trying to access producer routes, redirect to activation
    if (isProducerInactive && href.startsWith('/producer')) {
      navigate('/producer-activation');
    } else {
      navigate(href);
    }
    
    // Close sidebar on mobile after navigation
    if (isMobile) setIsOpen(false);
  };
  
  return (
    <>
      {/* Only show overlay on mobile and only when sidebar is open */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[#0e0e0e] text-white",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          isCollapsed ? "w-[80px]" : "w-[240px]",
          isMobile ? "shadow-lg" : ""
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#272727]">
          <div className="flex items-center gap-2">
            <Headphones size={24} className="text-purple-600" />
            {!isCollapsed && (
              <span className="font-heading font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text text-xl">
                OrderSOUNDS
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Only show close button on mobile */}
            {isMobile && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsOpen(false)}
              >
                <ChevronLeft size={16} />
              </Button>
            )}
          </div>
        </div>
        
        <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
          {getSidebarContent().map((section, index) => (
            <div key={index} className="mb-6">
              {!isCollapsed && (
                <h2 className="px-3 mb-2 text-xs font-medium uppercase text-gray-400">
                  {section.title}
                </h2>
              )}
              <nav className="flex flex-col gap-1">
                {section.items.map((item: any, idx: number) => {
                  // For items with onClick (like Sign Out), use a button
                  if (item.onClick) {
                    return (
                      <button
                        key={idx}
                        onClick={() => handleNavigation(item.href, item.onClick)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          "text-[#b3b3b3]",
                          isCollapsed && "justify-center"
                        )}
                      >
                        <item.icon 
                          size={20} 
                          className="text-[#b3b3b3]"
                        />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    );
                  }
                  
                  // Special handling for producer routes with inactive check
                  const isProducerRoute = item.href.startsWith('/producer');
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavigation(item.href)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                        "hover:bg-purple-500/20 hover:text-white",
                        (window.location.pathname === item.href)
                          ? "text-purple-500 border-r-4 border-purple-500 font-medium rounded-r-none"
                          : "text-[#b3b3b3] border-r-0",
                        isCollapsed && "justify-center"
                      )}
                    >
                      <item.icon 
                        size={20} 
                        className={(window.location.pathname === item.href) ? "text-purple-500" : "text-[#b3b3b3]"}
                      />
                      {!isCollapsed && <span>{item.title}</span>}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Only show the collapse toggle on desktop */}
        {!isMobile && (
          <div className="flex items-center justify-center p-4 border-t border-[#272727]">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full hover:bg-purple-500/20 hover:text-purple-500 transition-colors"
              onClick={toggleCollapsed}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>
          </div>
        )}
      </aside>
    </>
  );
}
