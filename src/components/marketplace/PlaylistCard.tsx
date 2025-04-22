
import { Playlist } from '@/types';
import { Card } from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

export const PlaylistCard = ({ playlist, className }: PlaylistCardProps) => {
  const beatCount = playlist.beats?.length || 0;

  // Predefined vibrant gradients for playlists
  const gradients = [
    'bg-gradient-to-br from-[#9b87f5] to-[#7E69AB]',  // Purple
    'bg-gradient-to-br from-[#F97316] to-[#FF5733]',  // Orange
    'bg-gradient-to-br from-[#22C55E] to-[#15803D]',  // Green
    'bg-gradient-to-br from-[#D946EF] to-[#9333EA]',  // Pink/Purple
  ];
  
  // Generate a consistent gradient based on playlist ID
  const getPlaylistGradient = (id: string) => {
    const hash = id.split('-')[0];
    const charSum = [...hash].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return gradients[charSum % gradients.length];
  };

  return (
    <Link to={`/playlists/${playlist.id}`}>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300",
          "aspect-square w-full rounded-2xl",
          getPlaylistGradient(playlist.id),
          className
        )}
      >
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 text-xs font-medium text-white bg-white/20 rounded-full backdrop-blur-sm">
            {beatCount} {beatCount === 1 ? 'track' : 'tracks'}
          </span>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-semibold text-xl text-white mb-1 line-clamp-1">
            {playlist.name}
          </h3>
        </div>
      </Card>
    </Link>
  );
}
