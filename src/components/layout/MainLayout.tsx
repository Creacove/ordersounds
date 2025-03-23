
import { useEffect } from "react";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";
import { useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  hideSidebar?: boolean;
}

export function MainLayout({ children, hideSidebar = false }: MainLayoutProps) {
  const location = useLocation();

  // Smooth scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Topbar />
      <div className="flex flex-1">
        {!hideSidebar && <Sidebar />}
        <main 
          className={cn(
            "flex-1 transition-all duration-300 animate-fade-in",
            hideSidebar ? "ml-0" : "ml-0 md:ml-[70px] lg:ml-[240px]" 
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
