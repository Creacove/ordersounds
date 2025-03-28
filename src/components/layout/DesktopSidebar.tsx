
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DesktopSidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  getSidebarContent: () => any[];
  location: any;
}

export function DesktopSidebar({ 
  isCollapsed, 
  toggleSidebar, 
  getSidebarContent,
  location
}: DesktopSidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 ease-in-out",
        "bg-[#0e0e0e] text-white",
        isCollapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
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
                if (item.onClick) {
                  // For items with onClick (e.g., "Sign Out"), they should not be "active"
                  return (
                    <TooltipProvider key={idx} delayDuration={isCollapsed ? 100 : 1000}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={item.onClick}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                              "hover:bg-purple-500/20 hover:text-white",
                              "text-[#b3b3b3] border-r-0",
                              isCollapsed ? "justify-center" : ""
                            )}
                          >
                            <item.icon
                              size={18}
                              className="text-[#b3b3b3]"
                            />
                            {!isCollapsed && <span>{item.title}</span>}
                          </button>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            {item.title}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                }
                
                return (
                  <TooltipProvider key={idx} delayDuration={isCollapsed ? 100 : 1000}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.href}
                          className={({ isActive }) => {
                            return cn(
                              "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                              "hover:bg-purple-500/20 hover:text-white",
                              isActive
                                ? "text-purple-500 border-r-4 border-purple-500 font-medium rounded-r-none"
                                : "text-[#b3b3b3] border-r-0",
                              isCollapsed ? "justify-center" : ""
                            );
                          }}
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon
                                size={18}
                                className={cn(
                                  "transition-colors",
                                  isActive ? "text-purple-500" : "text-[#b3b3b3]"
                                )}
                              />
                              {!isCollapsed && <span>{item.title}</span>}
                            </>
                          )}
                        </NavLink>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          {item.title}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center p-4 border-t border-[#272727]">
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full hover:bg-purple-500/20 hover:text-purple-500 transition-colors"
          onClick={toggleSidebar}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
    </aside>
  );
}
