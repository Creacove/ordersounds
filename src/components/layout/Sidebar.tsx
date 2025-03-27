
import { 
  Home, 
  TrendingUp, 
  Star, 
  ListMusic, 
  LayoutGrid, 
  BarChart, 
  User, 
  Heart, 
  ShoppingBag 
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom"; // Adjust based on your routing library
import { cn } from "@/lib/utils"; // Assuming a utility for className concatenation

const getSidebarContent = () => {
  const sections = [];

  // Section 1: EXPLORE Beats
  sections.push({
    title: "EXPLORE Beats",
    items: [
      { icon: Home, title: "Home", href: "/" },
      { icon: TrendingUp, title: "Trending", href: "/trending" },
      { icon: Star, title: "New", href: "/new" },
      { icon: ListMusic, title: "Playlist", href: "/playlist" },
      { icon: LayoutGrid, title: "Genres", href: "/genres" },
      { icon: BarChart, title: "Charts", href: "/charts" },
      { icon: User, title: "Producers", href: "/producers" },
    ],
  });

  // Section 2: LIBRARY
  sections.push({
    title: "LIBRARY",
    items: [
      { icon: Heart, title: "Favourites", href: "/favourites" },
      { icon: ListMusic, title: "My Playlists", href: "/my-playlists" },
      { icon: ShoppingBag, title: "Orders", href: "/orders" },
    ],
  });

  return sections;
};

const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 w-[240px] flex flex-col border-r bg-sidebar">
      <div className="flex flex-col flex-1 gap-2 p-4 overflow-y-auto">
        {getSidebarContent().map((section, index) => (
          <div key={index} className="mb-6">
            <h2 className="px-3 mb-2 text-xs font-medium text-sidebar-foreground/60">
              {section.title}
            </h2>
            <nav className="flex flex-col gap-1">
              {section.items.map((item, idx) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={idx}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200",
                      isActive
                        ? "bg-purple-600 text-white border-l-4 border-purple-500"
                        : "text-muted-foreground hover:bg-purple-500/20 hover:text-purple-500"
                    )}
                  >
                    <item.icon
                      size={18}
                      className={isActive ? "text-white" : "text-muted-foreground"}
                    />
                    <span>{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default DesktopSidebar;
