
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Headphones, Menu, AlignJustify } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  handleSignOut: () => void;
  getSidebarContent: () => any[];
  isCollapsed?: boolean;
  toggleCollapsed?: () => void;
}

export function MobileSidebar({ 
  isOpen, 
  setIsOpen, 
  user, 
  handleSignOut, 
  getSidebarContent,
  isCollapsed = false,
  toggleCollapsed
}: MobileSidebarProps) {
  const isMobile = useIsMobile();

  return (
    <>
      {/* Only show overlay on mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[#0e0e0e] text-white",
          isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0",
          isCollapsed ? "w-[70px]" : "w-[240px]",
          // No box-shadow for desktop mode
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
            {toggleCollapsed && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={toggleCollapsed}
              >
                {isCollapsed ? <AlignJustify size={16} /> : <Menu size={16} />}
              </Button>
            )}
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
                {section.items.map((item, idx) => {
                  // For items with onClick (like Sign Out), they shouldn't be "active"
                  if (item.onClick) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.onClick && item.onClick();
                          if (isMobile) setIsOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          "text-[#b3b3b3]",
                          isCollapsed && "justify-center"
                        )}
                      >
                        <item.icon 
                          size={18} 
                          className="text-[#b3b3b3]"
                        />
                        {!isCollapsed && <span>{item.title}</span>}
                      </button>
                    );
                  }
                  
                  return (
                    <NavLink
                      key={idx}
                      to={item.href}
                      onClick={() => {
                        if (isMobile) setIsOpen(false);
                      }}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          isActive
                            ? "text-purple-500 border-r-4 border-purple-500 font-medium rounded-r-none"
                            : "text-[#b3b3b3] border-r-0",
                          isCollapsed && "justify-center"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon 
                            size={18} 
                            className={isActive ? "text-purple-500" : "text-[#b3b3b3]"}
                          />
                          {!isCollapsed && <span>{item.title}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
