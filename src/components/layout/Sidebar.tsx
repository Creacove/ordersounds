import { useState, useEffect } from "react";
import { NavLink, useLocation, Link } from "react-router-dom";
import { 
  Home, 
  TrendingUp, 
  Clock, 
  List, 
  Library, 
  Heart, 
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  Music,
  LayoutDashboard,
  DollarSign,
  Settings,
  Disc,
  ShoppingCart,
  User,
  MoreHorizontal,
  LogOut,
  Search,
  BookOpen,
  PlaySquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileMenuItem {
  icon: React.ReactNode;
  label: string;
  to: string;
  id: string;
  badge?: number | null;
  action?: () => void;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const { isPlaying, currentBeat } = usePlayer();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [activeBottomTab, setActiveBottomTab] = useState("");

  useEffect(() => {
    if (!isMobile) {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }

    const path = location.pathname;

    if (path === "/") setActiveBottomTab("home");
    else if (path === "/genres" || path === "/discover") setActiveBottomTab("discover");
    else if (path === "/trending") setActiveBottom
