
import { SidebarProvider } from "@/components/ui/sidebar";
import { UnifiedSidebar } from "./UnifiedSidebar";
import { Topbar } from "./Topbar";
import { MobileBottomNav } from "./MobileBottomNav";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { LazyCartProvider } from "@/context/LazyCartContext";
import { ScrollToTop } from "@/components/utils/ScrollToTop";

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function MainLayoutWithPlayer({ children, activeTab }: MainLayoutWithPlayerProps) {
  return (
    <LazyCartProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          <UnifiedSidebar />
          <div className="flex-1 flex flex-col">
            <Topbar />
            <main className="flex-1 overflow-auto pb-20 md:pb-24">
              {children}
              <ScrollToTop />
            </main>
            <PersistentPlayer />
            <MobileBottomNav activeTab={activeTab} />
          </div>
        </div>
      </SidebarProvider>
    </LazyCartProvider>
  );
}
