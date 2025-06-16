
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Music, Play, Pause, Trash2 } from 'lucide-react';
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";

interface CartItemCardProps {
  item: {
    beatId: string;
    licenseType: string;
    addedAt: string;
    beat: {
      id: string;
      title: string;
      producer_name: string;
      cover_image_url: string;
      genre?: string;
    };
  };
  price: number;
  onRemove: (beatId: string) => void;
}

const CartItemCard = memo(({ item, price, onRemove }: CartItemCardProps) => {
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { currency } = useAuth();

  const handlePlayBeat = () => {
    if (currentBeat?.id === item.beat.id) {
      playBeat(isPlaying ? null : item.beat);
    } else {
      playBeat(item.beat);
    }
  };

  return (
    <div className="border rounded-xl bg-card/50 backdrop-blur-sm shadow-sm p-3 flex gap-3">
      <div className="flex-shrink-0 w-16 h-16">
        <div
          className="relative w-16 h-16 rounded-md overflow-hidden cursor-pointer group"
          onClick={handlePlayBeat}
        >
          <img
            src={item.beat.cover_image_url || "/placeholder.svg"}
            alt={item.beat.title || "Beat"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/placeholder.svg";
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {isPlaying && currentBeat?.id === item.beat.id ? (
              <Pause className="h-6 w-6 text-white" />
            ) : (
              <Play className="h-6 w-6 ml-1 text-white" />
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold truncate">{item.beat.title || 'Unknown Beat'}</h3>
            <p className="text-xs text-muted-foreground">{item.beat.producer_name || 'Unknown Producer'}</p>
            
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {item.beat.genre && (
                <Badge variant="outline" className="text-xs py-0 px-1.5">
                  <Music size={10} className="mr-1" />
                  {item.beat.genre}
                </Badge>
              )}
              
              <Badge variant="secondary" className="text-xs py-0 px-1.5 capitalize">
                {item.licenseType} License
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <span className="font-semibold text-sm">
              {currency === 'NGN' ? '₦' : '$'}
              {Math.round(price).toLocaleString()}
            </span>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-muted-foreground hover:text-destructive mt-1"
              onClick={() => onRemove(item.beatId)}
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

CartItemCard.displayName = 'CartItemCard';

export default CartItemCard;
