
import { Playlist } from '@/types';
import { Card, CardContent } from "@/components/ui/card";
import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface PlaylistCardProps {
  playlist: Playlist;
  className?: string;
}

export const PlaylistCard = ({ playlist, className }: PlaylistCardProps) => {
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
          <img
            src={playlist.cover_image || '/placeholder.svg'}
            alt={playlist.name}
            className="h-full w-full object-cover transition-all group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon"
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Play size={20} />
            </Button>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-1">{playlist.name}</h3>
          <p className="text-sm text-muted-foreground">
            {playlist.beats?.length || 0} beats
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
