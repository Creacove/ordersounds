
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
    
    // Default image options based on playlist name
    const imageOptions = [
      '/placeholder.svg',
      'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=400&h=400',
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=400&h=400',
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&h=400',
      'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?auto=format&fit=crop&w=400&h=400',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&h=400'
    ];
    
    // Use playlist id as seed to select a consistent image
    const hash = playlist.id.split('-')[0];
    const charSum = [...hash].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const imageUrl = imageOptions[charSum % imageOptions.length];
    
    return (
      <img 
        src={imageUrl} 
        alt={playlist.name} 
        className="h-full w-full object-cover"
      />
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
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-semibold text-base line-clamp-1">{playlist.name}</h3>
          <p className="text-sm text-muted-foreground">
            {beatCount} {beatCount === 1 ? 'beat' : 'beats'}
          </p>
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
