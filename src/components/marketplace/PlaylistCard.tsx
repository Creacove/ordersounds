
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
    
    // If we have beats, show up to 4 of them in a grid
    const beatsToShow = playlist.beats.slice(0, 4);
    
    if (beatsToShow.length === 1) {
      const firstBeat = beatsToShow[0];
      const imageUrl = typeof firstBeat === 'string' 
        ? '/placeholder.svg'
        : ((firstBeat as any).cover_image_url || '/placeholder.svg');
      
      return (
        <img 
          src={imageUrl} 
          alt={playlist.name} 
          className="h-full w-full object-cover"
        />
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-1 h-full w-full">
        {beatsToShow.map((beat, index) => {
          const imageUrl = typeof beat === 'string'
            ? '/placeholder.svg'
            : ((beat as any).cover_image_url || '/placeholder.svg');
          
          const altText = typeof beat === 'string'
            ? `Track ${index + 1}`
            : (beat as any).title;
            
          return (
            <div key={index} className="aspect-square overflow-hidden">
              <img 
                src={imageUrl}
                alt={altText}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          );
        })}
        {Array.from({ length: 4 - beatsToShow.length }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-muted aspect-square" />
        ))}
      </div>
    );
  };
  
  return (
    <Link to={`/playlists/${playlist.id}`}>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-md",
          "rounded-lg h-full flex flex-col",
          className
        )}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          {generateCoverImages()}
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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
};
