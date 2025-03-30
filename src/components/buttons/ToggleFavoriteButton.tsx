import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useBeats } from "@/hooks/useBeats";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(beatId));
  }, [beatId, isFavorite]);

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }
    
    try {
      const result = await toggleFavorite(beatId);
      setFavorite(result);
      
      if (result) {
        await supabase.rpc('increment_counter', {
          p_table_name: 'beats',
          p_column_name: 'favorites_count',
          p_id: beatId
        });
      } else {
        const { data: beat } = await supabase
          .from('beats')
          .select('favorites_count')
          .eq('id', beatId)
          .single();
          
        if (beat && beat.favorites_count > 0) {
          await supabase
            .from('beats')
            .update({ favorites_count: beat.favorites_count - 1 })
            .eq('id', beatId);
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
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
    >
      <Heart className={`${iconSizes[size]} ${favorite ? 'fill-current' : ''}`} />
    </Button>
  );
}
