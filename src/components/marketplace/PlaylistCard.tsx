
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

  // Generate cover images following the library card style
  const generateCoverImages = () => {
    if (!playlist.beats || playlist.beats.length === 0) {
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <ListMusic className={cn("text-muted-foreground", isMobile ? "h-8 w-8" : "h-10 w-10")} />
        </div>
      );
    }
    
    if (playlist.cover_image) {
      return (
        <img 
          src={playlist.cover_image} 
          alt={playlist.name} 
          className="h-full w-full object-cover"
        />
      );
    }
    
    // Generate a color based on the playlist ID
    const colors = [
      'bg-[#7C5DFA]', // Purple
      'bg-[#E17055]', // Orange/Coral
      'bg-[#6BCB77]', // Green
      'bg-[#D53F8C]', // Pink
      'bg-[#38B2AC]', // Teal
      'bg-[#9F7AEA]', // Lavender
      'bg-[#ED64A6]', // Hot Pink
      'bg-[#4299E1]'  // Blue
    ];
    
    const hash = playlist.id.split('-')[0];
    const charSum = [...hash].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colorClass = colors[charSum % colors.length];
    
    return (
      <div className={cn("w-full h-full flex items-end p-6", colorClass)}>
        <h3 className="text-white font-semibold text-xl line-clamp-1">
          {playlist.name}
        </h3>
      </div>
    );
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
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {generateCoverImages()}
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon"
              className="rounded-full h-12 w-12 bg-purple-600 hover:bg-purple-700 text-primary-foreground"
            >
              <Play size={20} />
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
            {beatCount} {beatCount === 1 ? 'track' : 'tracks'}
          </div>
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-semibold text-base line-clamp-1">{playlist.name}</h3>
          <div className={cn(
            "flex items-center mt-1 text-xs", 
            playlist.is_public ? "text-sky-500" : "text-amber-500"
          )}>
            <span>{playlist.is_public ? 'Public' : 'Private'}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
