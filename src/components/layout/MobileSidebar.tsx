
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { User } from "@/types";

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: User | null;
  handleSignOut: () => void;
  getSidebarContent: () => any[];
}

export function MobileSidebar({ 
  isOpen, 
  setIsOpen, 
  user, 
  handleSignOut, 
  getSidebarContent 
}: MobileSidebarProps) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out",
          "bg-[#0e0e0e] text-white",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "w-[280px] md:w-[320px]" // Slightly wider on desktop
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#272727]">
          <h2 className="font-medium">
            {user?.role === "producer" ? "Producer Menu" : "OrderSOUNDS Menu"}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => setIsOpen(false)}
          >
            <ChevronLeft size={16} />
          </Button>
        </div>
        
        <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
          {getSidebarContent().map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="px-3 mb-2 text-xs font-medium uppercase text-gray-400">
                {section.title}
              </h2>
              <nav className="flex flex-col gap-1">
                {section.items.map((item, idx) => {
                  // For items with onClick (like Sign Out), they shouldn't be "active"
                  if (item.onClick) {
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.onClick && item.onClick();
                          setIsOpen(false);
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          "text-[#b3b3b3]"
                        )}
                      >
                        <item.icon 
                          size={18} 
                          className="text-[#b3b3b3]"
                        />
                        <span>{item.title}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <NavLink
                      key={idx}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-all duration-200",
                          "hover:bg-purple-500/20 hover:text-white",
                          isActive
                            ? "text-purple-500 border-r-4 border-purple-500 font-medium rounded-r-none"
                            : "text-[#b3b3b3] border-r-0"
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon 
                            size={18} 
                            className={isActive ? "text-purple-500" : "text-[#b3b3b3]"}
                          />
                          <span>{item.title}</span>
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
