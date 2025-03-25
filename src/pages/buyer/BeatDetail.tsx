
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Pause, Heart, Download, ShoppingCart, 
  Share2, ArrowLeft, Music, Info, Tag, Clock, User, Globe
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

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();
  const { getBeatById, toggleFavorite, isFavorite, isPurchased } = useBeats();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { addToCart } = useCart();
  const { currency } = useAuth();
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  
  // Fetch beat details
  const { data: beat, isLoading } = useQuery({
    queryKey: ['beat', beatId],
    queryFn: () => getBeatById(beatId || ''),
    enabled: !!beatId,
  });

  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat?.id;
  const isBeatFavorite = beat ? isFavorite(beat.id) : false;
  const isBeatPurchased = beat ? isPurchased(beat.id) : false;

  // Find similar beats based on genre, BPM, or producer
  useEffect(() => {
    if (beat) {
      const { getProducerBeats, beats } = useBeats();
      
      // First get beats from same producer
      const producerBeats = getProducerBeats(beat.producer_id)
        .filter(b => b.id !== beat.id)
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
  }, [beat]);

  const handlePlay = () => {
    if (beat) {
      playBeat(beat);
    }
  };

  const handleToggleFavorite = () => {
    if (beat) {
      toggleFavorite(beat.id);
    }
  };

  const handleAddToCart = () => {
    if (beat && !isBeatPurchased) {
      addToCart(beat);
      toast.success(`Added "${beat.title}" to cart`);
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
          <div className="grid gap-6 animate-pulse">
            <div className="aspect-square bg-muted rounded-md w-full max-w-md"></div>
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-12 bg-muted rounded w-full"></div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="container max-w-6xl py-6">
        {/* Navigation */}
        <div className="flex items-center space-x-2 mb-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={18} />
          </Link>
          <span className="text-muted-foreground">/</span>
          <Link to="/trending" className="text-muted-foreground hover:text-foreground">
            Beats
          </Link>
        </div>

        <div className="grid md:grid-cols-[1fr_2fr] gap-8">
          {/* Beat Cover and Actions */}
          <div className="flex flex-col gap-6">
            <div className="aspect-square bg-muted rounded-md overflow-hidden">
              <img 
                src={beat.cover_image_url || '/placeholder.svg'} 
                alt={beat.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                size="lg"
                onClick={handlePlay}
                className="w-full"
              >
                {isCurrentlyPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                {isCurrentlyPlaying ? 'Pause' : 'Play'}
              </Button>
              
              {!isBeatPurchased ? (
                <Button 
                  size="lg"
                  onClick={handleAddToCart} 
                  variant="secondary"
                  className="w-full"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
              ) : (
                <Button 
                  size="lg"
                  variant="outline"
                  className="w-full"
                  onClick={() => toast.success('You already own this beat')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              )}
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-4">
              <Button 
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
                className={cn(
                  "flex-1 rounded-full",
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
                className="flex-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <Share2 size={18} />
              </Button>
              
              <PriceTag
                localPrice={beat.price_local}
                diasporaPrice={beat.price_diaspora}
                size="lg"
                className="ml-auto"
              />
            </div>

            {/* Audio Preview */}
            <div className="bg-card border rounded-md p-3">
              <h3 className="text-sm font-medium mb-2">Preview</h3>
              <AudioPlayer src={beat.preview_url} />
            </div>
          </div>

          {/* Beat Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">{beat.title}</h1>
              <Link to={`/producer/${beat.producer_id}`} className="text-lg font-medium text-muted-foreground hover:text-primary">
                {beat.producer_name}
              </Link>
            </div>

            {/* Beat Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Genre</p>
                  <p className="font-medium">{beat.genre}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Tag size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{beat.track_type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">BPM</p>
                  <p className="font-medium">{beat.bpm}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <User size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Likes</p>
                  <p className="font-medium">{beat.favorites_count}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Globe size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Downloads</p>
                  <p className="font-medium">{beat.purchase_count}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Info size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">License</p>
                  <p className="font-medium">{beat.license_type || 'Standard'}</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            {beat.tags && beat.tags.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {beat.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {beat.description && (
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{beat.description}</p>
              </div>
            )}

            {/* License Terms */}
            {beat.license_terms && (
              <div className="bg-muted/30 rounded-md p-4 border">
                <h3 className="text-lg font-medium mb-2">License Terms</h3>
                <p className="text-sm text-muted-foreground">{beat.license_terms}</p>
              </div>
            )}

            {/* Similar Beats */}
            {similarBeats.length > 0 && (
              <div>
                <h3 className="text-xl font-bold mb-4">Similar Beats</h3>
                <div className="space-y-3">
                  {similarBeats.map((similarBeat) => (
                    <BeatListItem 
                      key={similarBeat.id} 
                      beat={similarBeat}
                      isFavorite={isFavorite(similarBeat.id)}
                      isInCart={false}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default BeatDetail;
