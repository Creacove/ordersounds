
import React from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Play, Pause, Heart, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/PriceTag';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface BeatListItemProps {
  beat: Beat;
  isFavorite?: boolean;
  isInCart?: boolean;
  onRemove?: (beatId: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export function BeatListItem({
  beat,
  isFavorite = false,
  isInCart = false,
  onRemove,
  onToggleFavorite
}: BeatListItemProps) {
  const { currency } = useAuth();
  const { playBeat, isPlaying, currentBeat, addToQueue } = usePlayer();
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;

  const handlePlay = () => {
    playBeat(beat);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(beat);
    toast.success(`Added "${beat.title}" to queue`);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(beat.id);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(beat.id);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-card/90 transition-colors">
      {/* Thumbnail with play button */}
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
        <img 
          src={beat.cover_image_url || '/placeholder.svg'} 
          alt={beat.title}
          className="h-full w-full object-cover"
        />
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isCurrentlyPlaying ? 
            <Pause className="h-6 w-6 text-white" /> : 
            <Play className="h-6 w-6 text-white" />
          }
        </button>
      </div>
      
      {/* Beat details */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{beat.title}</h3>
        <p className="text-sm text-muted-foreground truncate">{beat.producer_name}</p>
        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
          <span>{beat.genre}</span>
          <span>•</span>
          <span>{beat.bpm} BPM</span>
        </div>
      </div>
      
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={`rounded-full ${
            isFavorite 
              ? "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20" 
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
        </Button>
        
        {isInCart && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="rounded-full text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 size={18} />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost"
              size="icon"
              className="rounded-full text-muted-foreground hover:text-foreground"
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddToQueue}>
              Add to queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePlay}>
              {isCurrentlyPlaying ? "Pause" : "Play"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="ml-2 font-medium">
          {currency === 'NGN' ? (
            <span>₦{beat.price_local.toLocaleString()}</span>
          ) : (
            <span>${beat.price_diaspora.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
