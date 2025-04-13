import React from 'react';
import { cn } from "@/lib/utils";
import { ButtonProps } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { NavLink } from "react-router-dom";
import {
  Home,
  Disc,
  Music2,
  Library,
  ListMusic,
  Users,
  ShoppingCart,
  Calendar,
  Award,
} from "lucide-react";

interface SidebarContentSectionsProps {
  className?: string;
  onRouteHover?: (path: string) => void;
}

export function SidebarContentSections({
  className,
  onRouteHover
}: SidebarContentSectionsProps) {
  const { user } = useAuth();
  
  const handleMouseEnter = (path: string) => {
    if (onRouteHover) {
      onRouteHover(path);
    }
  };

  const mainNavigationLinkClasses = ({ isActive }: { isActive: boolean }) => cn(
    "group flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-md",
    isActive 
      ? "bg-muted/70 text-foreground font-medium" 
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  const bottomNavigationLinkClasses = ({ isActive }: { isActive: boolean }) => cn(
    "group flex items-center gap-x-3 px-3 py-2.5 text-sm font-medium rounded-md",
    isActive
      ? "bg-muted/70 text-foreground font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  );

  const recoveryContent = (
    <div className="flex flex-col items-center justify-center h-full">
      <p className="text-sm text-muted-foreground text-center mb-4">
        {user ? "No playlists found." : "Sign in to access your playlists."}
      </p>
      {!user && (
        <NavLink to="/login" className="text-sm text-primary hover:underline">
          Sign In
        </NavLink>
      )}
    </div>
  );

  const sections = [
    {
      title: "Explore",
      links: [
        { name: "Home", href: "/", icon: <Home size={18} /> },
        { name: "Trending", href: "/trending", icon: <Disc size={18} /> },
        { name: "New Releases", href: "/new", icon: <Music2 size={18} /> },
        { name: "Producers", href: "/producers", icon: <Users size={18} /> },
        { name: "Genres", href: "/genres", icon: <ListMusic size={18} /> },
      ],
    },
    {
      title: "Library",
      links: [
        { name: "Playlists", href: "/playlists", icon: <ListMusic size={18} /> },
        { name: "Favorites", href: "/favorites", icon: <Library size={18} /> },
      ],
    },
    {
      title: "Account",
      links: [
        { name: "Purchases", href: "/purchases", icon: <ShoppingCart size={18} /> },
        { name: "Producer Program", href: "/producer-program", icon: <Award size={18} /> },
      ],
    },
  ];

  return (
    <div className={cn("py-4 px-1", className)}>
      {/* Main Navigation */}
      <div className="px-2">
        <ul className="space-y-1">
          <li>
            <NavLink to="/" className={mainNavigationLinkClasses} end>
              <Home size={18} />
              <span>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/trending" className={mainNavigationLinkClasses} onMouseEnter={() => handleMouseEnter('/trending')}>
              <Disc size={18} />
              <span>Trending</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/new" className={mainNavigationLinkClasses} onMouseEnter={() => handleMouseEnter('/new')}>
              <Music2 size={18} />
              <span>New Releases</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/producers" className={mainNavigationLinkClasses} onMouseEnter={() => handleMouseEnter('/producers')}>
              <Users size={18} />
              <span>Producers</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/genres" className={mainNavigationLinkClasses} onMouseEnter={() => handleMouseEnter('/genres')}>
              <ListMusic size={18} />
              <span>Genres</span>
            </NavLink>
          </li>
        </ul>
      </div>

      {/* Secondary Navigation */}
      {user && (
        <div className="mt-6 px-2">
          <h4 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
            Your Library
          </h4>
          <ul className="space-y-1">
            <li>
              <NavLink to="/playlists" className={bottomNavigationLinkClasses}>
                <ListMusic size={18} />
                <span>Playlists</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/favorites" className={bottomNavigationLinkClasses}>
                <Library size={18} />
                <span>Favorites</span>
              </NavLink>
            </li>
          </ul>
        </div>
      )}

      {/* Account Navigation */}
      {user && (
        <div className="mt-6 px-2">
          <h4 className="mb-2 px-3 text-sm font-medium text-muted-foreground">
            Account
          </h4>
          <ul className="space-y-1">
            <li>
              <NavLink to="/purchases" className={bottomNavigationLinkClasses}>
                <ShoppingCart size={18} />
                <span>Purchases</span>
              </NavLink>
            </li>
            <li>
              <NavLink to="/producer-program" className={bottomNavigationLinkClasses}>
                <Award size={18} />
                <span>Producer Program</span>
              </NavLink>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
