import React from 'react';
import { Playlist, Beat } from '@/types';
import { ListMusic, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (id: string) => void;
  onPlay?: (playlist: Playlist) => void;
}

export function PlaylistCard({ playlist, onClick, onPlay }: PlaylistCardProps) {
  const beatCount = playlist.beats?.length || 0;
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
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
    
    // Check if beats is an array of strings (IDs) or Beat objects
    const beatsToShow = playlist.beats.slice(0, 4);
    
    if (beatsToShow.length === 1) {
      // Handle both string IDs and Beat objects
      const firstBeat = beatsToShow[0];
      const imageUrl = typeof firstBeat === 'string' 
        ? '/placeholder.svg'  // If it's just a string ID
        : ((firstBeat as unknown as Beat).cover_image_url || '/placeholder.svg');
      
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
          // Handle both string IDs and Beat objects
          const imageUrl = typeof beat === 'string'
            ? '/placeholder.svg'  // If it's just a string ID
            : ((beat as unknown as Beat).cover_image_url || '/placeholder.svg');
          
          const altText = typeof beat === 'string'
            ? `Track ${index + 1}`
            : (beat as unknown as Beat).title;
            
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

  const handleClick = () => {
    onClick(playlist.id);
    // Always navigate to the correct URL with 's' in playlists
    if (playlist.is_public) {
      navigate(`/playlists/${playlist.id}`);
    } else {
      navigate(`/my-playlists/${playlist.id}`);
    }
  };

  return (
    <div 
      className={cn(
        "bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all overflow-hidden",
        isMobile ? "max-w-[160px]" : ""
      )}
    >
      <div 
        className="aspect-square rounded-md overflow-hidden group relative cursor-pointer"
        onClick={handleClick}
      >
        {generateCoverImages()}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {onPlay && beatCount > 0 && (
            <Button 
              size="icon" 
              className={cn("rounded-full", isMobile ? "h-8 w-8" : "h-10 w-10")}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(playlist);
              }}
            >
              <Play size={isMobile ? 16 : 18} />
            </Button>
          )}
        </div>
      </div>
      <div className={cn("p-3", isMobile ? "p-2" : "")}>
        <h3 
          className={cn("font-medium truncate cursor-pointer", isMobile ? "text-sm" : "")}
          onClick={handleClick}
        >
          {playlist.name}
        </h3>
        <p className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
          {beatCount} {beatCount === 1 ? 'beat' : 'beats'}
        </p>
        <div className={cn(
          "flex items-center mt-1", 
          playlist.is_public ? "text-sky-500" : "text-amber-500",
          isMobile ? "text-[10px]" : "text-xs"
        )}>
          <span>{playlist.is_public ? 'Public' : 'Private'}</span>
        </div>
      </div>
    </div>
  );
}
