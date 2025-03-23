import React from 'react';
import { Playlist } from '@/types';
import { ListMusic } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (id: string) => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  const beatCount = playlist.beats?.length || 0;
  
  const generateCoverImages = () => {
    if (!playlist.beats || playlist.beats.length === 0) {
      return (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <ListMusic className="h-10 w-10 text-muted-foreground" />
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
    
    const beatsToShow = playlist.beats.slice(0, 4);
    
    if (beatsToShow.length === 1) {
      return (
        <img 
          src={beatsToShow[0].cover_image_url || '/placeholder.svg'} 
          alt={playlist.name} 
          className="h-full w-full object-cover"
        />
      );
    }
    
    return (
      <div className="grid grid-cols-2 gap-1 h-full w-full">
        {beatsToShow.map((beat, index) => (
          <div key={index} className="aspect-square overflow-hidden">
            <img 
              src={beat.cover_image_url || '/placeholder.svg'} 
              alt={beat.title} 
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
        ))}
        {Array.from({ length: 4 - beatsToShow.length }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-muted aspect-square" />
        ))}
      </div>
    );
  };

  return (
    <div 
      className="bg-card hover:bg-card/80 transition-colors rounded-lg p-4 cursor-pointer"
      onClick={() => onClick(playlist.id)}
    >
      <div className="aspect-square rounded-md bg-muted mb-3 overflow-hidden">
        {generateCoverImages()}
      </div>
      <h3 className="font-medium truncate">{playlist.name}</h3>
      <p className="text-sm text-muted-foreground">
        {beatCount} {beatCount === 1 ? 'beat' : 'beats'}
      </p>
    </div>
  );
}
