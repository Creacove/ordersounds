
import React, { useState } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Pause, Heart, Trash2, MoreVertical, Plus, ShoppingCart, Download } from 'lucide-react';
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
import { getLicensePrice } from '@/utils/licenseUtils';
import { supabase } from '@/integrations/supabase/client';

interface BeatListItemProps {
  beat: Beat;
  isFavorite?: boolean;
  isInCart?: boolean;
  isPurchased?: boolean;
  onRemove?: (beatId: string) => void;
  onToggleFavorite?: (id: string) => void;
  onPlay?: () => void;
}

export function BeatListItem({
  beat,
  isFavorite = false,
  isInCart = false,
  isPurchased = false,
  onRemove,
  onToggleFavorite,
  onPlay
}: BeatListItemProps) {
  const { currency } = useAuth();
  const { playBeat, isPlaying, currentBeat, addToQueue } = usePlayer();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isPlayButtonClicked, setIsPlayButtonClicked] = useState(false);
  
  const isCurrentBeat = currentBeat?.id === beat.id;
  const isCurrentlyPlaying = isCurrentBeat && isPlaying;

  const handlePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Prevent double clicks
    if (isPlayButtonClicked) return;
    setIsPlayButtonClicked(true);
    
    if (onPlay) {
      onPlay();
    } else {
      playBeat(beat);
      await incrementPlayCount(beat.id);
    }
    
    // Re-enable after a short delay
    setTimeout(() => {
      setIsPlayButtonClicked(false);
    }, 300);
  };

  const incrementPlayCount = async (beatId: string) => {
    try {
      await supabase.rpc("increment_counter" as any, {
        p_table_name: "beats",
        p_column_name: "plays",
        p_id: beatId
      });
      console.log('Incremented play count for beat:', beatId);
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(beat);
    toast.success(`Added "${beat.title}" to queue`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isInCart) {
      const beatWithLicense = {
        ...beat,
        selected_license: 'basic'
      };
      addToCart(beatWithLicense);
      toast.success(`Added "${beat.title}" to cart`);
    } else {
      navigate('/cart');
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

  const handleClick = () => {
    navigate(`/beat/${beat.id}`);
  };
  
  const downloadBeat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isPurchased) {
      toast.error('You need to purchase this beat first');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = beat.full_track_url;
      link.download = `${beat.title} - ${beat.producer_name}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download beat');
    }
  };
  
  const getBasicLicensePrice = () => {
    const isDiaspora = currency === 'USD';
    return isDiaspora 
      ? beat.basic_license_price_diaspora || 0
      : beat.basic_license_price_local || 0;
  };

  return (
    <div 
      onClick={handleClick} 
      className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-lg border bg-card hover:bg-card/90 transition-colors shadow-sm hover:shadow cursor-pointer"
    >
      <div className="relative h-16 w-full sm:w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted">
        <img 
          src={beat.cover_image_url || '/placeholder.svg'} 
          alt={beat.title}
          className="h-full w-full object-cover"
        />
        <button
          onClick={handlePlay}
          disabled={isPlayButtonClicked}
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
        >
          {isCurrentlyPlaying ? 
            <Pause className="h-6 w-6 text-white" /> : 
            <Play className="h-6 w-6 text-white" />
          }
        </button>
        
        {isCurrentlyPlaying && (
          <div className="absolute top-1 right-1 bg-primary/80 text-primary-foreground text-[10px] px-1 py-0.5 rounded-full">
            Playing
          </div>
        )}
        
        {isPurchased && (
          <div className="absolute top-1 left-1 bg-green-500/80 text-white text-[10px] px-1 py-0.5 rounded-full">
            Owned
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium truncate">{beat.title}</h3>
        <Link 
          to={`/producer/${beat.producer_id}`} 
          onClick={(e) => e.stopPropagation()}
          className="text-sm text-muted-foreground hover:text-primary truncate block"
        >
          {beat.producer_name}
        </Link>
        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
          <span>{beat.genre}</span>
          <span>•</span>
          <span>{beat.bpm} BPM</span>
          <span>•</span>
          <span>{beat.plays || 0} plays</span>
          <span>•</span>
          <span>{beat.favorites_count || 0} likes</span>
        </div>
        {isMobile && (
          <div className="mt-1">
            <PriceTag
              localPrice={getBasicLicensePrice()}
              diasporaPrice={getBasicLicensePrice()}
              licenseType="basic"
              size="sm"
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 mt-2 sm:mt-0">
        {!isInCart && !isPurchased && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddToCart}
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <ShoppingCart size={18} />
          </Button>
        )}
        
        {isInCart && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              navigate('/cart');
            }}
            className="rounded-full bg-primary/20 text-primary hover:bg-primary/30"
          >
            <ShoppingCart size={18} />
          </Button>
        )}
        
        {isPurchased && (
          <Button
            variant="ghost"
            size="icon"
            onClick={downloadBeat}
            className="rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30"
          >
            <Download size={18} />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleFavorite}
          className={cn(
            "rounded-full",
            isFavorite 
              ? "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
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
              className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleAddToQueue} className="cursor-pointer">
              <Plus className="mr-2 h-4 w-4" />
              <span>Add to queue</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePlay} className="cursor-pointer">
              {isCurrentlyPlaying ? (
                <>
                  <Pause className="mr-2 h-4 w-4" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  <span>Play</span>
                </>
              )}
            </DropdownMenuItem>
            {isPurchased && (
              <DropdownMenuItem onClick={downloadBeat} className="cursor-pointer">
                <Download className="mr-2 h-4 w-4" />
                <span>Download</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {!isMobile && (
          <div className="ml-2 shrink-0 font-medium whitespace-nowrap">
            <PriceTag
              localPrice={getBasicLicensePrice()}
              diasporaPrice={getBasicLicensePrice()}
              licenseType="basic"
              size="sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
