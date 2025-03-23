
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Beat } from '@/types';
import { PriceTag } from './PriceTag';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Play, Pause, ShoppingCart, Heart, Plus, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { getUserPlaylists, addBeatToPlaylist } from '@/lib/playlistService';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BeatCardProps {
  beat: Beat;
  onPlay?: (id: string) => void;
  onAddToCart?: (beat: Beat) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  isPurchased?: boolean;
  isInCart?: boolean;
  className?: string;
}

export function BeatCard({
  beat,
  onPlay,
  onAddToCart,
  onToggleFavorite,
  isFavorite = false,
  isPurchased = false,
  isInCart = false,
  className,
}: BeatCardProps) {
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat, addToQueue } = usePlayer();
  const { addToCart } = useCart();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const navigate = useNavigate();
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playBeat(beat);
    if (onPlay) {
      onPlay(beat.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onAddToCart) {
      onAddToCart(beat);
    } 
    else if (!isInCart) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to add favorites');
      return;
    }
    
    if (onToggleFavorite) {
      onToggleFavorite(beat.id);
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
    }
  };
  
  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToQueue(beat);
    toast.success(`Added "${beat.title}" to queue`);
  };
  
  const loadPlaylists = async () => {
    if (!user || loadingPlaylists) return;
    
    setLoadingPlaylists(true);
    try {
      const userPlaylists = await getUserPlaylists(user.id);
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };
  
  const handleAddToPlaylist = async (playlistId: string) => {
    if (!user) return;
    
    try {
      await addBeatToPlaylist(playlistId, beat.id);
      toast.success(`Added to playlist`);
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast.error('Failed to add to playlist');
    }
  };

  const goToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/cart');
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      {/* Cover image with play button overlay */}
      <div className="relative aspect-square overflow-hidden bg-secondary/20">
        <img
          src={beat.cover_image_url || '/placeholder.svg'}
          alt={beat.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {/* Play button overlay - only on the image */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handlePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 shadow-md"
            aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
          >
            {isCurrentlyPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </div>

      {/* Beat info and action buttons - separate from the play overlay */}
      <div className="flex flex-col space-y-2 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <h3 className="font-semibold leading-none tracking-tight truncate">
              {beat.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{beat.producer_name}</p>
          </div>
          <PriceTag
            localPrice={beat.price_local}
            diasporaPrice={beat.price_diaspora}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {!isPurchased && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleAddToCart}
              disabled={isInCart}
              className={cn(
                "h-8 w-8 rounded-md",
                isInCart
                  ? "bg-primary/10 text-primary"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
              )}
              title={isInCart ? "In Cart" : "Add to Cart"}
            >
              <ShoppingCart size={16} />
            </Button>
          )}

          {isInCart && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToCart}
              className="h-8 w-8 rounded-md bg-primary/20 text-primary hover:bg-primary/30"
              title="Go to Cart"
            >
              <ShoppingCart size={16} />
            </Button>
          )}

          {user && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                className={cn(
                  "h-8 w-8 rounded-md transition-colors",
                  isFavorite
                    ? "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                    aria-label="More options"
                    title="More options"
                  >
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleAddToQueue} className="cursor-pointer">
                    Add to queue
                  </DropdownMenuItem>
                  <DropdownMenuSub onOpenChange={loadPlaylists}>
                    <DropdownMenuSubTrigger className="flex items-center cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Add to Playlist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {loadingPlaylists ? (
                          <DropdownMenuItem disabled>
                            Loading playlists...
                          </DropdownMenuItem>
                        ) : playlists.length === 0 ? (
                          <DropdownMenuItem disabled>
                            No playlists found
                          </DropdownMenuItem>
                        ) : (
                          playlists.map(playlist => (
                            <DropdownMenuItem
                              key={playlist.id}
                              onClick={() => handleAddToPlaylist(playlist.id)}
                              className="cursor-pointer"
                            >
                              {playlist.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePlay} className="cursor-pointer">
                    {isCurrentlyPlaying ? "Pause" : "Play"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
