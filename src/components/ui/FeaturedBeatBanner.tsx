
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Beat } from '@/types';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Play, Pause, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PriceTag } from '@/components/ui/PriceTag';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface FeaturedBeatBannerProps {
  beat: Beat;
}

export function FeaturedBeatBanner({ beat }: FeaturedBeatBannerProps) {
  const navigate = useNavigate();
  const { playBeat, isPlaying, currentBeat, pausePlayback } = usePlayer();
  const { addToCart, isInCart } = useCart();
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
  const inCart = isInCart ? isInCart(beat.id) : false;
  
  const handlePlay = () => {
    if (isCurrentlyPlaying) {
      pausePlayback();
    } else {
      playBeat(beat);
    }
  };
  
  const handleAddToCart = () => {
    addToCart(beat);
    toast.success(`Added "${beat.title}" to cart`);
  };
  
  const handleProducerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/producer/${beat.producer_id}`);
  };
  
  const handleViewDetails = () => {
    navigate(`/beat/${beat.id}`);
  };

  return (
    <div 
      className="relative overflow-hidden rounded-xl border bg-gradient-to-r from-primary/10 to-secondary/10 shadow-md cursor-pointer"
      onClick={handleViewDetails}
    >
      <div className="flex flex-col md:flex-row p-6 md:p-8 gap-8">
        {/* Cover image */}
        <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg">
            <img 
              src={beat.cover_image_url || '/placeholder.svg'} 
              alt={beat.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform shadow-lg">
                {isCurrentlyPlaying ? <Pause size={24} /> : <Play size={24} />}
              </div>
            </button>
          </div>
        </div>
        
        {/* Beat info */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center mb-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Featured Beat
              </Badge>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{beat.title}</h1>
            <button 
              onClick={handleProducerClick}
              className="text-lg text-primary hover:underline font-medium mb-6 block"
            >
              {beat.producer_name}
            </button>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="font-medium">{beat.genre}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BPM</p>
                <p className="font-medium">{beat.bpm}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <p className="font-medium">{beat.track_type}</p>
              </div>
            </div>
            
            {beat.description && (
              <p className="text-muted-foreground mb-6 line-clamp-2">
                {beat.description}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="mr-2">
              <PriceTag
                localPrice={beat.price_local}
                diasporaPrice={beat.price_diaspora}
                size="lg"
              />
            </div>
            
            <div className="flex gap-2">
              {!inCart ? (
                <Button 
                  size="lg" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart();
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Buy Now
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/cart');
                  }}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View in Cart
                </Button>
              )}
              
              <Button 
                size="lg" 
                variant={isCurrentlyPlaying ? "secondary" : "outline"} 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
              >
                {isCurrentlyPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isCurrentlyPlaying ? 'Pause' : 'Play'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
