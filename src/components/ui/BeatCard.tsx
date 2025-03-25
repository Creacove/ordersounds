
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
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from '@/hooks/use-mobile';
import { getLicensePrice } from '@/utils/licenseUtils';
import { getUserPlaylists, addBeatToPlaylist } from '@/lib/playlistService';

interface BeatCardProps {
  beat: Beat;
  onPlay?: (id: string) => void;
  onAddToCart?: (beat: Beat) => void;
  onToggleFavorite?: (id: string) => void;
  isFavorite?: boolean;
  isPurchased?: boolean;
  isInCart?: boolean;
  className?: string;
  compact?: boolean;
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
  compact = false,
}: BeatCardProps) {
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat, addToQueue } = usePlayer();
  const { addToCart, isInCart: checkIsInCart } = useCart();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
  const inCart = isInCart || (checkIsInCart && checkIsInCart(beat.id));

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playBeat(beat);
    if (onPlay) {
      onPlay(beat.id);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, licenseType: string = beat.license_type || 'basic') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please log in to add to cart');
      navigate('/login');
      return;
    }
    
    if (isPurchased) {
      toast.info('You already own this beat');
      return;
    }
    
    if (onAddToCart) {
      onAddToCart(beat);
    } 
    else if (!inCart) {
      const beatWithLicense = {
        ...beat,
        selected_license: licenseType
      };
      addToCart(beatWithLicense);
      toast.success(`Added "${beat.title}" (${licenseType} license) to cart`);
    } else {
      navigate('/cart');
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

  const goToBeatDetail = () => {
    navigate(`/beat/${beat.id}`);
  };
  
  const displayLicenseType = beat.license_type || 'basic';
  
  const getDisplayPrice = () => {
    const { currency } = useAuth();
    const isDiaspora = currency === 'USD';
    
    if (displayLicenseType && !['basic', 'premium', 'exclusive'].includes(displayLicenseType)) {
      return isDiaspora ? beat.price_diaspora : beat.price_local;
    }
    
    return getLicensePrice(beat, displayLicenseType, isDiaspora);
  };

  return (
    <div
      onClick={goToBeatDetail}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition-all hover:shadow-md cursor-pointer",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.cover_image_url || '/placeholder.svg'}
          alt={beat.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handlePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 shadow-xl"
            aria-label={isCurrentlyPlaying ? "Pause" : "Play"}
          >
            {isCurrentlyPlaying ? <Pause size={22} /> : <Play size={22} className="ml-1" />}
          </button>
        </div>
        
        {isCurrentlyPlaying && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
            Playing
          </div>
        )}
        {isPurchased && (
          <div className="absolute top-2 left-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full">
            Purchased
          </div>
        )}
        
        {displayLicenseType && !['basic', 'premium', 'exclusive'].includes(displayLicenseType) && (
          <div className="absolute bottom-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded-full capitalize">
            {displayLicenseType}
          </div>
        )}
      </div>

      <div className="flex flex-col p-3 space-y-2">
        <div className="flex flex-col">
          <h3 className="font-medium text-sm leading-tight tracking-tight truncate">
            {beat.title}
          </h3>
          <p className="text-xs text-muted-foreground truncate mb-1.5">
            {beat.producer_name}
          </p>
          <PriceTag
            localPrice={getDisplayPrice()}
            diasporaPrice={getDisplayPrice()}
            size="xs"
            className="self-start"
            licenseType={!['basic', 'premium', 'exclusive'].includes(displayLicenseType) ? displayLicenseType : undefined}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              goToBeatDetail();
            }}
          />
        </div>
        
        <div className="flex items-center gap-1.5 pt-1">
          {!isPurchased && !inCart && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleAddToCart(e, displayLicenseType)}
              className="h-7 w-7 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90"
              title="Add to Cart"
            >
              <ShoppingCart size={14} />
            </Button>
          )}

          {inCart && (
            <Button
              variant="ghost"
              size="icon"
              onClick={goToCart}
              className="h-7 w-7 rounded-lg bg-primary/20 text-primary hover:bg-primary/30"
              title="Go to Cart"
            >
              <ShoppingCart size={14} />
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
                  "h-7 w-7 rounded-lg transition-colors",
                  isFavorite
                    ? "bg-purple-500/20 text-purple-500 hover:bg-purple-500/30"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                )}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 ml-auto"
                    aria-label="More options"
                    title="More options"
                  >
                    <MoreVertical size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleAddToQueue} className="cursor-pointer text-xs">
                    Add to queue
                  </DropdownMenuItem>
                  <DropdownMenuSub onOpenChange={loadPlaylists}>
                    <DropdownMenuSubTrigger className="flex items-center cursor-pointer text-xs">
                      <Plus className="mr-2 h-3 w-3" />
                      <span>Add to Playlist</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {loadingPlaylists ? (
                          <DropdownMenuItem disabled className="text-xs">
                            Loading playlists...
                          </DropdownMenuItem>
                        ) : playlists.length === 0 ? (
                          <DropdownMenuItem disabled className="text-xs">
                            No playlists found
                          </DropdownMenuItem>
                        ) : (
                          playlists.map(playlist => (
                            <DropdownMenuItem
                              key={playlist.id}
                              onClick={() => handleAddToPlaylist(playlist.id)}
                              className="cursor-pointer text-xs"
                            >
                              {playlist.name}
                            </DropdownMenuItem>
                          ))
                        )}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePlay} className="cursor-pointer text-xs">
                    {isCurrentlyPlaying ? "Pause" : "Play"}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      goToBeatDetail();
                    }} 
                    className="cursor-pointer text-xs"
                  >
                    View Details
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
