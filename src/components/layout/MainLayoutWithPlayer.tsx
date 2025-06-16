
import { SidebarProvider } from "@/components/ui/sidebar";
import { Topbar } from "./Topbar";
import { PersistentPlayer } from "@/components/player/PersistentPlayer";
import { LazyCartProvider } from "@/context/LazyCartContext";
import { ScrollToTop } from "@/components/utils/ScrollToTop";
import { Sidebar } from "./Sidebar";

interface MainLayoutWithPlayerProps {
  children: React.ReactNode;
  activeTab?: string;
}

export function MainLayoutWithPlayer({ children, activeTab }: MainLayoutWithPlayerProps) {
  return (
    <LazyCartProvider>
      <div className="min-h-screen bg-background flex w-full">
        <Sidebar activeTab={activeTab} />
        <div className="flex-1 flex flex-col">
          <Topbar />
          <main className="flex-1 overflow-auto pb-20 md:pb-24">
            {children}
            <ScrollToTop />
          </main>
          <PersistentPlayer />
        </div>
      </div>
    </LazyCartProvider>
  );
}
