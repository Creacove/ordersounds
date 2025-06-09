
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface ToggleFavoriteButtonProps {
  beatId: string;
  size?: "sm" | "md" | "lg";
  absolutePosition?: boolean;
}

export function ToggleFavoriteButton({ 
  beatId, 
  size = "md", 
  absolutePosition = true 
}: ToggleFavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useBeats();
  const { user } = useAuth();
  const [isButtonClicked, setIsButtonClicked] = useState(false);

  // Get the current favorite status directly from the global state
  const favorite = isFavorite(beatId);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('ToggleFavoriteButton: Handle toggle favorite clicked for beat:', beatId);
    
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }
    
    // Prevent double clicks
    if (isButtonClicked) {
      console.log('ToggleFavoriteButton: Button click prevented (already processing)');
      return;
    }
    
    setIsButtonClicked(true);
    
    try {
      console.log('ToggleFavoriteButton: Calling toggleFavorite for beat:', beatId);
      const newFavoriteStatus = await toggleFavorite(beatId);
      console.log('ToggleFavoriteButton: Toggle favorite completed, new status:', newFavoriteStatus);
    } catch (error) {
      console.error('ToggleFavoriteButton: Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    } finally {
      // Re-enable after a short delay
      setTimeout(() => {
        setIsButtonClicked(false);
      }, 300);
    }
  };
  
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  };
  
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };

  console.log('ToggleFavoriteButton: Rendering for beat:', beatId, 'favorite:', favorite, 'user:', !!user);

  return (
    <Button
      variant="secondary"
      size="icon"
      className={`
        ${absolutePosition ? 'absolute top-2 right-2 z-10' : ''}
        ${sizeClasses[size]}
        bg-background/60 backdrop-blur-sm hover:bg-background/80
        ${favorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}
        transition-colors
      `}
      onClick={handleToggleFavorite}
      disabled={isButtonClicked}
    >
      <Heart className={`${iconSizes[size]} ${favorite ? 'fill-current' : ''}`} />
    </Button>
  );
}
