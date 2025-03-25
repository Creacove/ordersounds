// src/components/layout/Layout.tsx
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Bottombar from "./Bottombar"; // Ensure this file exists as provided below
import { useUser } from "@/hooks/useUser";
import { Toaster } from "@/components/ui/toaster";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative flex h-screen w-full">
      {/* Render Sidebar for non-mobile if user exists */}
      {!isMobile && user && (
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
      )}
      <main className="relative flex flex-1 flex-col bg-background pb-20">
        {children}
        <Toaster />
      </main>
      {/* Bottom navbar for mobile devices */}
      {isMobile && user && (
        <div className="fixed bottom-0 z-30 flex w-full items-center justify-between bg-white shadow-md dark:bg-black">
          <Bottombar userId={user.id} />
        </div>
      )}
    </div>
  );
};

export default Layout;
