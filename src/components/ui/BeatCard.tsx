
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Beat } from '@/types';
import { PriceTag } from './PriceTag';
import { useAuth } from '@/context/AuthContext';
import { Play, Pause, ShoppingCart, Heart } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface BeatCardProps {
  beat: Beat;
  onPlay?: (id: string) => void;
  onAddToCart?: (beat: Beat) => void;
  onToggleFavorite?: (id: string) => boolean;
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
  const { 
    playing, 
    togglePlay 
  } = useAudio(beat.preview_url);

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePlay();
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
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(beat.id);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow transition-all hover:shadow-md",
        className
      )}
    >
      <div className="aspect-square overflow-hidden bg-secondary/20">
        <img
          src={beat.cover_image_url || '/placeholder.svg'}
          alt={beat.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handlePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110"
          >
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
        </div>
      </div>

      <div className="flex flex-col space-y-1.5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold leading-none tracking-tight">
              {beat.title}
            </h3>
            <p className="text-sm text-muted-foreground">{beat.producer_name}</p>
          </div>
          <PriceTag
            localPrice={beat.price_local}
            diasporaPrice={beat.price_diaspora}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          {!isPurchased && (
            <button
              onClick={handleAddToCart}
              disabled={isInCart}
              className={cn(
                "flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium transition-colors",
                isInCart
                  ? "bg-primary/10 text-primary"
                  : "bg-primary/80 text-primary-foreground hover:bg-primary"
              )}
            >
              <ShoppingCart size={14} />
              {isInCart ? "In Cart" : "Add to Cart"}
            </button>
          )}

          {user && (
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                isFavorite
                  ? "bg-red-500/20 text-red-500"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
