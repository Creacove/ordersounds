
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ShoppingCart, Check } from 'lucide-react';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/PriceTag';
import { useAuth } from '@/context/AuthContext';
import { useLightweightAddToCart } from '@/hooks/useLightweightAddToCart';
import { useUniqueNotifications } from '@/hooks/useUniqueNotifications';
import { supabase } from '@/integrations/supabase/client';
import { ToggleFavoriteButton } from '@/components/buttons/ToggleFavoriteButton';

interface BeatCardCompactProps {
  beat: Beat;
}

export function BeatCardCompact({ beat }: BeatCardCompactProps) {
  const { user } = useAuth();
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  const { handleAddToCart, isInCart } = useLightweightAddToCart();
  const [isHovering, setIsHovering] = useState(false);
  const { isDuplicate, addNotification } = useUniqueNotifications();
  const [isPlayButtonClicked, setIsPlayButtonClicked] = useState(false);
  
  const isCurrentBeat = currentBeat?.id === beat.id;
  const isCurrentlyPlaying = isCurrentBeat && isPlaying;
  const inCart = isInCart(beat.id);
  
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

  const handlePlay = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isPlayButtonClicked) return;
    
    setIsPlayButtonClicked(true);
    
    console.log("Play button clicked for:", beat.title);
    
    try {
      if (isCurrentBeat) {
        console.log("Toggling current beat:", beat.title);
        togglePlayPause();
      } else {
        console.log("Playing new beat:", beat.title);
        if (!beat.preview_url) {
          console.warn("Beat doesn't have a preview URL:", beat.title);
          return;
        }
        
        playBeat(beat);
        incrementPlayCount(beat.id);
      }
    } catch (error) {
      console.error("Error handling play:", error);
    } finally {
      setTimeout(() => {
        setIsPlayButtonClicked(false);
      }, 1000);
    }
  };

  const handleCartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('BeatCardCompact: Cart button clicked for beat:', beat.title);
    await handleAddToCart(beat);
  };
  
  return (
    <Link
      to={`/beat/${beat.id}`}
      className="group block overflow-hidden rounded-lg border bg-card transition hover:shadow-md h-full"
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
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
        </AspectRatio>
        
        <div className="absolute inset-0 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
          <Button
            size="icon"
            variant="secondary" 
            className="h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/95"
            onClick={handlePlay}
            disabled={isPlayButtonClicked}
          >
            {isCurrentlyPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>
        </div>

        <ToggleFavoriteButton beatId={beat.id} />

        <Button 
          size="icon"
          variant="secondary"
          className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCartClick}
        >
          {inCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="p-3">
        <h3 className="font-medium text-sm truncate">{beat.title}</h3>
        <p className="text-xs text-muted-foreground truncate mb-1.5">{beat.producer_name}</p>
        
        <div className="flex justify-between items-center mt-1">
          <PriceTag 
            localPrice={beat.basic_license_price_local} 
            diasporaPrice={beat.basic_license_price_diaspora || beat.basic_license_price_local}
            size="sm"
          />
          <div className="text-xs text-muted-foreground">
            {beat.bpm} BPM
          </div>
        </div>
      </div>

      {isCurrentlyPlaying && (
        <div className="h-1 bg-primary animate-pulse" />
      )}
    </Link>
  );
}
