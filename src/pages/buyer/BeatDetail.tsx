
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Pause, Heart, Download, ShoppingCart, 
  Share2, ArrowLeft, Music, Info, Tag, Clock, User, Globe,
  AudioWaveform
} from 'lucide-react';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioPlayer } from '@/components/ui/AudioPlayer';
import { PriceTag } from '@/components/ui/PriceTag';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();
  const { getBeatById, toggleFavorite, isFavorite, isPurchased, beats } = useBeats();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  
  // Fetch beat details with better error handling
  const { data: beat, isLoading, error } = useQuery({
    queryKey: ['beat', beatId],
    queryFn: async () => {
      if (!beatId) throw new Error('Beat ID is required');
      const result = await getBeatById(beatId);
      if (!result) throw new Error('Beat not found');
      return result;
    },
    enabled: !!beatId,
  });

  useEffect(() => {
    if (beat) {
      document.title = `${beat.title} by ${beat.producer_name} | OrderSOUNDS`;
    }
  }, [beat]);

  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat?.id;
  const isBeatFavorite = beat ? isFavorite(beat.id) : false;
  const isBeatPurchased = beat ? isPurchased(beat.id) : false;
  const beatInCart = beat ? isInCart(beat.id) : false;

  // Find similar beats based on genre, BPM, or producer
  useEffect(() => {
    if (beat && beats && beats.length > 0) {
      // First get beats from same producer
      const producerBeats = beats
        .filter(b => b.producer_id === beat.producer_id && b.id !== beat.id)
        .slice(0, 2);
      
      // Then get beats with same genre
      const genreBeats = beats
        .filter(b => b.genre === beat.genre && b.id !== beat.id && !producerBeats.some(pb => pb.id === b.id))
        .slice(0, 2);
      
      // Then get beats with similar BPM (±5)
      const bpmBeats = beats
        .filter(b => 
          Math.abs(b.bpm - beat.bpm) <= 5 && 
          b.id !== beat.id && 
          !producerBeats.some(pb => pb.id === b.id) && 
          !genreBeats.some(gb => gb.id === b.id)
        )
        .slice(0, 2);
      
      // Combine and limit to 5 similar beats
      setSimilarBeats([...producerBeats, ...genreBeats, ...bpmBeats].slice(0, 5));
    }
  }, [beat, beats]);

  const handlePlay = () => {
    if (beat) {
      playBeat(beat);
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      toast.error('Please log in to add favorites');
      navigate('/login');
      return;
    }

    if (beat) {
      toggleFavorite(beat.id);
    }
  };

  const handleAddToCart = () => {
    if (beat && !isBeatPurchased && !beatInCart) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
    } else if (beatInCart) {
      navigate('/cart');
    }
  };

  const handleShare = () => {
    if (navigator.share && beat) {
      navigator.share({
        title: `${beat.title} by ${beat.producer_name}`,
        text: `Check out this beat: ${beat.title} by ${beat.producer_name}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Could not share:', err);
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  if (error) {
    return (
      <MainLayoutWithPlayer>
        <div className="container max-w-6xl py-12 px-4 text-center">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Beat Not Found</h1>
            <p className="text-muted-foreground">Sorry, we couldn't find the beat you're looking for.</p>
            <Button onClick={() => navigate('/trending')}>Browse Beats</Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  if (isLoading || !beat) {
    return (
      <MainLayoutWithPlayer>
        <div className="container max-w-6xl py-6">
          <div className="flex items-center space-x-2 mb-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold">Loading beat details...</h1>
          </div>
          <div className="grid md:grid-cols-[1fr_2fr] gap-8 animate-pulse">
            <div className="space-y-6">
              <Skeleton className="aspect-square rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 rounded-md" />
                <Skeleton className="h-12 rounded-md" />
              </div>
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-32 rounded-md" />
            </div>
            <div className="space-y-8">
              <div>
                <Skeleton className="h-10 w-3/4 mb-2 rounded-md" />
                <Skeleton className="h-6 w-1/2 rounded-md" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <Skeleton className="h-4 w-1/2 rounded-md" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-32 rounded-md" />
            </div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="relative">
        {/* Hero section with blurred background */}
        <div className="absolute inset-0 overflow-hidden h-[30vh] -z-10">
          <img 
            src={beat.cover_image_url} 
            alt="" 
            className="w-full h-full object-cover object-center opacity-20 blur-xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 to-background" />
        </div>
        
        <div className="container max-w-6xl py-6 md:py-12 px-4 md:px-6">
          {/* Navigation */}
          <div className="flex items-center space-x-2 mb-6 md:mb-10">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="rounded-full h-8 w-8"
            >
              <ArrowLeft size={16} />
            </Button>
            <Link to="/trending" className="text-sm text-muted-foreground hover:text-foreground">
              Beats
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to={`/genres`} className="text-sm text-muted-foreground hover:text-foreground">
              {beat.genre}
            </Link>
          </div>

          <div className="grid md:grid-cols-[1fr_2fr] gap-8 md:gap-12">
            {/* Beat Cover and Actions */}
            <div className="flex flex-col gap-6">
              <div className="aspect-square bg-card rounded-xl overflow-hidden border shadow-lg relative group">
                <img 
                  src={beat.cover_image_url || '/placeholder.svg'} 
                  alt={beat.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button 
                    size="icon"
                    variant="secondary"
                    className="h-16 w-16 rounded-full shadow-xl"
                    onClick={handlePlay}
                  >
                    {isCurrentlyPlaying ? 
                      <Pause className="h-8 w-8" /> : 
                      <Play className="h-8 w-8 ml-1" />
                    }
                  </Button>
                </div>
              </div>

              {/* Primary Actions */}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  size="lg"
                  onClick={handlePlay}
                  className="w-full rounded-xl"
                  variant={isCurrentlyPlaying ? "secondary" : "default"}
                >
                  {isCurrentlyPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isCurrentlyPlaying ? 'Pause' : 'Play'}
                </Button>
                
                {!isBeatPurchased ? (
                  <Button 
                    size="lg"
                    onClick={handleAddToCart} 
                    variant={beatInCart ? "outline" : "secondary"}
                    className="w-full rounded-xl"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {beatInCart ? 'View Cart' : 'Add to Cart'}
                  </Button>
                ) : (
                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={() => toast.success('You already own this beat')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
              </div>

              {/* Secondary Actions */}
              <div className="flex gap-4 items-center">
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "h-10 w-10 rounded-full",
                    isBeatFavorite 
                      ? "text-purple-500 bg-purple-500/10 hover:bg-purple-500/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Heart size={18} fill={isBeatFavorite ? "currentColor" : "none"} />
                </Button>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleShare}
                  className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Share2 size={18} />
                </Button>
                
                <div className="ml-auto flex items-center">
                  <PriceTag
                    localPrice={beat.price_local}
                    diasporaPrice={beat.price_diaspora}
                    size="lg"
                  />
                </div>
              </div>

              {/* Audio Preview */}
              <div className="bg-card border rounded-xl p-4 shadow">
                <div className="flex items-center mb-3">
                  <AudioWaveform size={18} className="text-primary mr-2" />
                  <h3 className="text-sm font-medium">Preview Track</h3>
                </div>
                <AudioPlayer src={beat.preview_url} />
              </div>
            </div>

            {/* Beat Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 tracking-tight">{beat.title}</h1>
                <Link 
                  to={`/producer/${beat.producer_id}`} 
                  className="text-lg font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {beat.producer_name}
                </Link>
              </div>

              {/* Beat Metadata */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 p-6 bg-card rounded-xl border shadow-sm">
                <div className="flex items-center gap-3">
                  <Music size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Genre</p>
                    <p className="font-medium">{beat.genre}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Tag size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="font-medium">{beat.track_type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">BPM</p>
                    <p className="font-medium">{beat.bpm}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <User size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Likes</p>
                    <p className="font-medium">{beat.favorites_count}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Downloads</p>
                    <p className="font-medium">{beat.purchase_count}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Info size={18} className="text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">License</p>
                    <p className="font-medium">{beat.license_type || 'Standard'}</p>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {beat.tags && beat.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {beat.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="rounded-full px-3 py-1">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {beat.description && (
                <div className="rounded-xl border p-5 bg-card">
                  <h3 className="text-lg font-medium mb-3">Description</h3>
                  <p className="text-muted-foreground">{beat.description}</p>
                </div>
              )}

              {/* License Terms */}
              {beat.license_terms && (
                <div className="bg-muted/30 rounded-xl p-5 border">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <Info size={16} className="mr-2 text-primary" />
                    License Terms
                  </h3>
                  <p className="text-sm text-muted-foreground">{beat.license_terms}</p>
                </div>
              )}

              {/* Similar Beats */}
              {similarBeats.length > 0 && (
                <div className="pt-4">
                  <h3 className="text-xl font-bold mb-4">Similar Beats</h3>
                  <div className="space-y-3 rounded-xl border p-4 bg-card/50">
                    {similarBeats.map((similarBeat) => (
                      <BeatListItem 
                        key={similarBeat.id} 
                        beat={similarBeat}
                        isFavorite={isFavorite(similarBeat.id)}
                        isInCart={isInCart(similarBeat.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default BeatDetail;
