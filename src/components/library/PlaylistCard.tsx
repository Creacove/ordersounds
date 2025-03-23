
import React from 'react';
import { Playlist } from '@/types';
import { ListMusic } from 'lucide-react';

interface PlaylistCardProps {
  playlist: Playlist;
  onClick: (id: string) => void;
}

export function PlaylistCard({ playlist, onClick }: PlaylistCardProps) {
  return (
    <div 
      className="bg-card rounded-lg p-4 hover:bg-card/80 transition-colors cursor-pointer"
      onClick={() => onClick(playlist.id)}
    >
      <div className="aspect-square rounded-md bg-muted mb-3 flex items-center justify-center">
        {playlist.cover_image ? (
          <img 
            src={playlist.cover_image} 
            alt={playlist.name} 
            className="h-full w-full object-cover rounded-md"
          />
        ) : (
          <ListMusic className="h-10 w-10 text-muted-foreground" />
        )}
      </div>
      <h3 className="font-medium">{playlist.name}</h3>
      <p className="text-sm text-muted-foreground">
        {playlist.beats?.length || 0} {(playlist.beats?.length || 0) === 1 ? 'beat' : 'beats'}
      </p>
    </div>
  );
}
