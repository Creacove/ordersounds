
import { Playlist } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Play, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

export const PlaylistCard = ({ playlist, className }: PlaylistCardProps) => {
  const isMobile = useIsMobile();
  const beatCount = playlist.beats?.length || 0;

  // Predefined vibrant color palette
  const colors = [
    'bg-[#9b87f5]',   // Primary Purple
    'bg-gradient-to-br from-[#F97316] to-[#FF5733]', // Bright Orange
    'bg-gradient-to-br from-[#0EA5E9] to-[#38BDF8]', // Ocean Blue
    'bg-gradient-to-br from-[#D946EF] to-[#EC4899]', // Magenta Pink
    'bg-gradient-to-br from-[#6E59A5] to-[#8B5CF6]', // Tertiary Purple
  ];
  
  // Generate a consistent color based on playlist ID
  const getPlaylistColor = (id: string) => {
    const hash = id.split('-')[0];
    const charSum = [...hash].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  return (
    <Link to={`/playlists/${playlist.id}`}>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-md",
          "rounded-lg h-full flex flex-col bg-card border border-border",
          className
        )}
      >
        <div 
          className={cn(
            "relative aspect-square w-full overflow-hidden",
            getPlaylistColor(playlist.id),
            "flex items-end p-4 text-white"
          )}
        >
          <div className="relative z-10 w-full">
            <h3 className="font-semibold text-xl line-clamp-1 mb-1">
              {playlist.name}
            </h3>
            <div className="text-xs opacity-80 flex justify-between items-center">
              <span>{beatCount} {beatCount === 1 ? 'track' : 'tracks'}</span>
              <span>{playlist.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

