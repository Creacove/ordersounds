
import { useState } from "react";
import { Play, Pause, Heart } from "lucide-react";
import { Beat } from "@/types";
import { PriceTag } from "./PriceTag";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useBeats } from "@/hooks/useBeats";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";

interface BeatCardProps {
  beat: Beat;
  className?: string;
  showControls?: boolean;
}

export function BeatCard({ beat, className, showControls = true }: BeatCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { addToCart } = useCart();
  const audioRef = useState<HTMLAudioElement | null>(null)[1];

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!audioRef) {
      const audio = new Audio(beat.preview_url);
      audio.addEventListener("ended", () => setIsPlaying(false));
      audio.addEventListener("error", () => {
        setIsPlaying(false);
        toast.error("Error playing preview");
      });
      audioRef(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioRef.pause();
      setIsPlaying(false);
    } else {
      audioRef.play();
      setIsPlaying(true);
    }
  };

  const handleFavoriteToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to add to favorites");
      return;
    }

    const newStatus = await toggleFavorite(beat.id);
    toast.success(newStatus ? "Added to favorites" : "Removed from favorites");
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to add to cart");
      return;
    }

    if (isPurchased(beat.id)) {
      toast.info("You already own this beat");
      return;
    }

    addToCart(beat);
  };

  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-lg bg-card transition-all duration-300",
        "hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        <img 
          src={beat.cover_image_url} 
          alt={beat.title}
          className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-70" />
        
        {/* Play/Pause button */}
        {showControls && (
          <button 
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
              "w-12 h-12 rounded-full flex items-center justify-center",
              "bg-primary text-primary-foreground shadow-lg",
              "transition-all duration-300 transform",
              isHovered ? "scale-100 opacity-100" : "scale-90 opacity-0"
            )}
            onClick={handlePlayToggle}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        )}
        
        {/* Favorite button */}
        {showControls && user && (
          <button 
            className={cn(
              "absolute top-3 right-3 w-8 h-8 rounded-full",
              "flex items-center justify-center transition-all duration-200",
              isFavorite(beat.id) 
                ? "bg-primary text-primary-foreground" 
                : "bg-black/40 text-white hover:bg-black/60",
            )}
            onClick={handleFavoriteToggle}
          >
            <Heart size={16} fill={isFavorite(beat.id) ? "currentColor" : "none"} />
          </button>
        )}
        
        {/* Producer name */}
        <div className="absolute bottom-2 left-2">
          <span className="inline-block text-xs font-medium text-white/80">
            {beat.producer_name}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-medium line-clamp-1">{beat.title}</h3>
          <PriceTag 
            localPrice={beat.price_local} 
            diasporaPrice={beat.price_diaspora}
            size="sm"
          />
        </div>
        
        <div className="flex flex-wrap gap-1 mb-3">
          {beat.tags.slice(0, 3).map(tag => (
            <span 
              key={tag} 
              className="text-[10px] bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
        
        {/* Actions */}
        {showControls && (
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-muted-foreground">
              {beat.bpm} BPM
            </span>
            
            {isPurchased(beat.id) ? (
              <span className="text-xs font-medium text-green-500">
                Purchased
              </span>
            ) : (
              <button 
                className="text-xs font-medium text-primary hover:text-primary/80"
                onClick={handleAddToCart}
              >
                Add to cart
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
