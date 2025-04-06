
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause } from 'lucide-react';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/PriceTag';
import { ToggleFavoriteButton } from '@/components/buttons/ToggleFavoriteButton';

interface BeatCardCompactProps {
  beat: Beat;
}

export function BeatCardCompact({ beat }: BeatCardCompactProps) {
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  const [isHovering, setIsHovering] = useState(false);
  
  const isCurrentBeat = currentBeat?.id === beat.id;
  
  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isCurrentBeat) {
      togglePlayPause();
    } else {
      playBeat(beat);
    }
  };
  
  return (
    <Link
      to={`/beat/${beat.id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition hover:shadow-md"
    >
      <div 
        className="relative" 
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <AspectRatio ratio={1 / 1}>
          <img
            src={beat.cover_image_url || "/placeholder.svg"}
            alt={beat.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </AspectRatio>
        
        <div className="absolute inset-0 bg-black/20 transition-opacity group-hover:opacity-100 flex items-center justify-center">
          <Button
            size="icon"
            variant="secondary" 
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/95"
            onClick={handlePlay}
          >
            {isCurrentBeat && isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>
        
        <ToggleFavoriteButton beatId={beat.id} absolutePosition />
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{beat.title}</h3>
        <p className="text-xs text-muted-foreground truncate mb-1.5">{beat.producer_name}</p>
        
        <div className="flex justify-between items-center mt-1">
          <PriceTag 
            localPrice={beat.basic_license_price_local} 
            diasporaPrice={beat.basic_license_price_diaspora} 
            size="sm"
          />
          <div className="text-xs text-muted-foreground">
            {beat.bpm} BPM
          </div>
        </div>
      </div>
    </Link>
  );
}
