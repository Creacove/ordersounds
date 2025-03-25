
import React from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Play, Pause, Heart, Trash2, MoreVertical, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/PriceTag';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';

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
  const { addToCart, isInCart: checkIsInCart } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
  const inCart = isInCart || (checkIsInCart && checkIsInCart(beat.id));

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    playBeat(beat);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(beat);
    toast.success(`Added "${beat.title}" to queue`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inCart) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
    }
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
  
  const handleViewBeatDetails = () => {
    navigate(`/beat/${beat.id}`);
  };

  const handleProducerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/producer/${beat.producer_id}`);
  };

  return (
    <div 
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border bg-card hover:bg-card/90 transition-colors shadow-sm hover:shadow cursor-pointer"
      onClick={handleViewBeatDetails}
    >
      {/* Thumbnail with play button */}
      <div className="relative h-16 w-full sm:w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
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
        <p 
          className="text-sm text-primary hover:underline truncate cursor-pointer" 
          onClick={handleProducerClick}
        >
          {beat.producer_name}
        </p>
        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
          <span>{beat.genre}</span>
          <span>•</span>
          <span>{beat.bpm} BPM</span>
        </div>
        {/* Show price tag on mobile */}
        {isMobile && (
          <div className="mt-1">
            <PriceTag
              localPrice={beat.price_local}
              diasporaPrice={beat.price_diaspora}
              size="sm"
            />
          </div>
        )}
      </div>
      
      {/* Action buttons - Buy button now more prominent */}
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 mt-2 sm:mt-0">
        {!inCart ? (
          <Button
            variant="default"
            size="sm"
            onClick={handleAddToCart}
            className="rounded text-xs"
          >
            <ShoppingCart size={14} className="mr-1" /> Buy
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/cart');
            }}
            className="rounded text-xs"
          >
            <ShoppingCart size={14} className="mr-1" /> View Cart
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePlay}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {isCurrentlyPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={cn(
            "h-8 w-8 rounded-full",
            isFavorite 
              ? "text-purple-500 hover:bg-purple-500/10" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </Button>
        
        {isInCart && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="h-8 w-8 rounded-full text-destructive hover:text-destructive/90 hover:bg-destructive/10"
          >
            <Trash2 size={16} />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleAddToQueue} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              <span>Add to queue</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/beat/${beat.id}`);
              }}
              className="cursor-pointer"
            >
              <span>View details</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Show price tag only on desktop */}
        {!isMobile && (
          <div className="ml-2 shrink-0 font-medium whitespace-nowrap">
            <PriceTag
              localPrice={beat.price_local}
              diasporaPrice={beat.price_diaspora}
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
