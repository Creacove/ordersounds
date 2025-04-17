
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MoreHorizontal, Play, Pause, ShoppingCart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Beat } from "@/types";
import { Badge } from "@/components/ui/badge";

export interface BeatCardProps {
  beat: Beat;
  isFavorite?: boolean;
  isPurchased?: boolean;
  isInCart?: boolean;
  showControls?: boolean;
  onPlayClick?: () => void;
  className?: string;
  showStatus?: boolean;
  onToggleFavorite?: (beatId: string) => Promise<boolean>;
}

export const BeatCard = ({
  beat,
  isFavorite = false,
  isPurchased = false,
  isInCart = false,
  showControls = true,
  onPlayClick,
  className,
  showStatus = false,
  onToggleFavorite,
}: BeatCardProps) => {
  const { title, producer_name, cover_image_url, status } = beat;
  const [isPlaying, setIsPlaying] = useState(false);
  const { addToCart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlayClick?.();
  };

  const handleAddToCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    addToCart(beat);
  };

  const handleRemoveFromCart = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeFromCart(beat.id);
  };

  return (
    <Card className={cn("relative overflow-hidden group", className)}>
      <div className="aspect-square relative">
        <img
          src={cover_image_url || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          {showControls && (
            <button onClick={handlePlayClick} className="rounded-full p-2 bg-white/80 hover:bg-white text-black">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
      
      {/* Add status badge if showStatus is true */}
      {showStatus && status === "draft" && (
        <Badge 
          variant="outline" 
          className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm"
        >
          Draft
        </Badge>
      )}

      <CardContent className="flex items-center justify-between p-3">
        <div>
          <h3 className="font-medium text-sm truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{producer_name}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-1 rounded-full bg-secondary hover:bg-secondary/80"
              aria-label="Open menu"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" forceMount>
            {user ? (
              <>
                <DropdownMenuItem onClick={() => navigate(`/beat/${beat.id}`)}>
                  View Details
                </DropdownMenuItem>
                {!isPurchased && (
                  <>
                    {isInCart ? (
                      <DropdownMenuItem onClick={(e) => handleRemoveFromCart(e)}>
                        Remove from Cart
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={(e) => handleAddToCart(e)}>
                        Add to Cart
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </>
            ) : (
              <DropdownMenuItem onClick={() => navigate('/login')}>
                Login to Buy
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
};
