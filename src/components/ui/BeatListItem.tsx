import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Beat } from "@/types";
import { Card } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Play, Pause } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useBeats } from "@/hooks/useBeats";
import { Badge } from "@/components/ui/badge";

// Add showStatus prop to the component's props
export interface BeatListItemProps {
  beat: Beat;
  isFavorite?: boolean;
  isPurchased?: boolean;
  isInCart?: boolean;
  showControls?: boolean;
  onPlayClick?: () => void;
  showStatus?: boolean;
}

export const BeatListItem = ({
  beat,
  isFavorite = false,
  isPurchased = false,
  isInCart = false,
  showControls = true,
  onPlayClick,
  showStatus = false,
}: BeatListItemProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();
  const { addToCart, removeFromCart } = useCart();
  const { toggleFavorite } = useBeats();
  const { title, producer_name, cover_image_url, status } = beat;

  const handlePlayClick = () => {
    setIsPlaying(!isPlaying);
    onPlayClick?.();
  };

  const handleAddToCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    addToCart(beat);
  };

  const handleRemoveFromCart = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    removeFromCart(beat.id);
  };

  const handleToggleFavorite = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    await toggleFavorite(beat.id);
  };

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all hover:shadow",
        isPlaying ? "bg-muted/70" : ""
      )}
    >
      <div className="flex items-center p-2 gap-3">
        <AspectRatio ratio={1 / 1} className="h-16 w-16 rounded-md overflow-hidden">
          <img
            src={cover_image_url || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover"
          />
        </AspectRatio>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 truncate">
              <h3 className="font-medium text-sm sm:text-base truncate">
                {beat.title}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {beat.producer_name}
              </p>
            </div>
            
            {/* Add status badge if showStatus is true */}
            {showStatus && beat.status === "draft" && (
              <Badge 
                variant="outline" 
                className="ml-2 bg-muted text-muted-foreground"
              >
                Draft
              </Badge>
            )}
            
            {/* Price and Controls */}
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm sm:text-base">
                ₦{beat.basic_license_price_local?.toLocaleString()}
              </span>
              {showControls && (
                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePlayClick}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleFavorite}
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                    className={isFavorite ? "text-red-500" : ""}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                  {isPurchased ? (
                    <Button variant="ghost" size="icon" disabled aria-label="Purchased">
                      <ShoppingCart className="h-4 w-4 text-green-500" />
                    </Button>
                  ) : isInCart ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFromCart}
                      aria-label="Remove from cart"
                    >
                      <ShoppingCart className="h-4 w-4 fill-current" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleAddToCart}
                      aria-label="Add to cart"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="link"
            className="w-full justify-start mt-1 -ml-1 text-xs"
            onClick={() => navigate(`/beat/${beat.id}`)}
          >
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
};
