
import { useState } from 'react';
import { Beat } from '@/types';
import { Button } from '@/components/ui/button';
import { Heart, Play, Pause, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from "@/components/ui/card";
import { getLicensePrice } from '@/utils/licenseUtils';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  onPlay?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onAddToCart?: (e: React.MouseEvent) => void;
  className?: string;
}

export const BeatCard = ({
  beat,
  isPlaying = false,
  onPlay,
  isFavorite = false,
  onToggleFavorite,
  onAddToCart,
  className
}: BeatCardProps) => {
  const isMobile = useIsMobile();
  const { currency } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onPlay) onPlay();
  };

  const basicPrice = getLicensePrice(beat, 'basic', currency === 'USD');
  const formattedPrice = currency === 'USD' ? `$${basicPrice}` : `₦${basicPrice}`;

  return (
    <Link to={`/beat/${beat.id}`}>
      <Card 
        className={cn(
          "group relative overflow-hidden transition-all duration-300 hover:shadow-md bg-card border border-border",
          "rounded-lg h-full flex flex-col",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-square w-full overflow-hidden bg-muted">
          <img
            src={beat.cover_image_url || '/placeholder.svg'}
            alt={beat.title}
            className="h-full w-full object-cover transition-all group-hover:scale-105"
          />
          <div className={cn(
            "absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 transition-opacity",
            (isHovered || isMobile) && "opacity-100"
          )}>
            <Button 
              onClick={handlePlay}
              size="icon"
              className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </Button>
          </div>
        </div>
        
        <CardContent className="flex flex-col justify-between p-4 flex-grow">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{beat.title}</h3>
            <p className="text-sm text-muted-foreground">{beat.producer_name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {beat.genre && (
                <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                  {beat.genre}
                </span>
              )}
              {beat.bpm && (
                <span className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full">
                  {beat.bpm} BPM
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <span className="font-medium">{formattedPrice}</span>
            <div className="flex gap-2">
              {onToggleFavorite && (
                <Button 
                  onClick={onToggleFavorite} 
                  size="icon" 
                  variant="ghost"
                  className={cn(
                    "h-8 w-8 rounded-full",
                    isFavorite && "text-red-500"
                  )}
                >
                  <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
                </Button>
              )}
              
              {onAddToCart && (
                <Button 
                  onClick={onAddToCart} 
                  size="icon" 
                  variant="ghost"
                  className="h-8 w-8 rounded-full"
                >
                  <ShoppingCart size={16} />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};
