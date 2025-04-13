
import { 
  Home, 
  TrendingUp, 
  Clock, 
  List, 
  Heart, 
  LayoutGrid,
  Music,
  LayoutDashboard,
  DollarSign,
  Settings,
  Disc,
  User,
  LogOut,
  Search,
  ShoppingCart,
  KeyRound,
  Users
} from "lucide-react";
import { User as UserType } from "@/types";

export const getSidebarSections = (user: UserType | null, handleSignOut: () => void) => {
  const sections = [];

  if (user?.role === "producer") {
    sections.push({
      title: "Producer",
      items: [
        { icon: LayoutDashboard, title: "Dashboard", href: "/producer/dashboard" },
        { icon: Music, title: "My Beats", href: "/producer/beats" },
        { icon: DollarSign, title: "Royalty Splits", href: "/producer/royalties" },
      ]
    });

    sections.push({
      title: "Marketplace",
      items: [
        { icon: Home, title: "Explore", href: "/" },
        { icon: TrendingUp, title: "Trending", href: "/trending" },
        { icon: Heart, title: "Favorites", href: "/favorites" },
        { icon: ShoppingCart, title: "Cart", href: "/cart" },
      ]
    });
  } else {
    sections.push({ 
      title: "Explore Beats", 
      items: [
        { icon: Home, title: "Home", href: "/" },
        { icon: TrendingUp, title: "Trending", href: "/trending" },
        { icon: Clock, title: "New", href: "/new" },
        { icon: List, title: "Playlists", href: "/playlists" },
        { icon: Disc, title: "Genres", href: "/genres" },
        { icon: Users, title: "Producers", href: "/producers" },
        { icon: Search, title: "Search", href: "/search" },
      ]
    });

    sections.push({ 
      title: "Library", 
      items: [
        { icon: Heart, title: "Favorites", href: "/favorites" },
        { icon: LayoutGrid, title: "My Playlists", href: "/my-playlists" },
        { icon: Music, title: "Purchased", href: "/purchased" },
      ]
    });
  }

  if (user) {
    sections.push({
      title: "Account",
      items: [
        { icon: User, title: "Profile", href: user.role === "producer" ? `/producer/${user.id}` : `/buyer/${user.id}` },
        { icon: Settings, title: "Settings", href: user.role === "producer" ? "/producer/settings" : "/settings" },
        { icon: LogOut, title: "Sign Out", href: "#", onClick: handleSignOut },
      ]
    });
  }

  return sections;
};
