
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Pause, Heart, Download, ShoppingCart, 
  Share2, ArrowLeft, Music, Info, Tag, Clock, User, Globe
} from 'lucide-react';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PriceTag } from '@/components/ui/PriceTag';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();
  const { getBeatById, toggleFavorite, isFavorite, isPurchased, beats } = useBeats();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const isMobile = useIsMobile();
  
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
        <div className="container max-w-4xl py-8 px-4 text-center">
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
        <div className="container max-w-4xl py-6">
          <div className="flex items-center space-x-2 mb-6">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-2xl font-bold">Loading beat details...</h1>
          </div>
          <div className="flex flex-col animate-pulse space-y-6">
            <Skeleton className="h-20 w-full rounded-md" />
            <div className="flex flex-col md:flex-row gap-4">
              <Skeleton className="h-32 w-32 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-8 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-1/2 rounded-md" />
                <div className="pt-2 flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="relative">
        {/* Background gradient */}
        <div className="absolute top-0 inset-x-0 h-[20vh] bg-gradient-to-b from-primary/20 to-background -z-10" />
        
        <div className="container max-w-4xl py-4 md:py-6 px-4">
          {/* Navigation */}
          <div className="flex items-center space-x-2 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="h-8 w-8 rounded-full"
            >
              <ArrowLeft size={16} />
            </Button>
            <div className="flex text-xs">
              <Link to="/trending" className="text-muted-foreground hover:text-foreground">
                Beats
              </Link>
              <span className="mx-1 text-muted-foreground">•</span>
              <Link to={`/genres`} className="text-muted-foreground hover:text-foreground">
                {beat.genre}
              </Link>
            </div>
          </div>
          
          {/* Main beat info */}
          <div className="rounded-xl bg-card/50 backdrop-blur-sm border shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-start gap-3 mb-1">
                <div 
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0 border shadow-sm"
                  onClick={handlePlay}
                >
                  <div className="relative group cursor-pointer h-full">
                    <img 
                      src={beat.cover_image_url} 
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isCurrentlyPlaying ? 
                        <Pause className="h-8 w-8 text-white" /> : 
                        <Play className="h-8 w-8 ml-1 text-white" />
                      }
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold mb-0.5 truncate">{beat.title}</h1>
                  <Link 
                    to={`/producer/${beat.producer_id}`} 
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors inline-block"
                  >
                    {beat.producer_name}
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock size={12} /> {beat.bpm} BPM
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Music size={12} /> {beat.genre}
                    </span>
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground">
                      {beat.track_type}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Play count and stats */}
              <div className="flex items-center justify-between my-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe size={12} className="text-primary/70" /> {beat.purchase_count || 0} downloads
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <User size={12} className="text-primary/70" /> {beat.favorites_count || 0} likes
                  </span>
                </div>
                <div>
                  <PriceTag
                    localPrice={beat.price_local}
                    diasporaPrice={beat.price_diaspora}
                    size="md"
                  />
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="flex items-center gap-2 mt-3 mb-2">
                <Button 
                  size={isMobile ? "sm" : "default"}
                  onClick={handlePlay}
                  className="flex-1 sm:flex-none rounded-full"
                  variant={isCurrentlyPlaying ? "secondary" : "default"}
                >
                  {isCurrentlyPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isCurrentlyPlaying ? 'Pause' : 'Play'}
                </Button>
                
                {!isBeatPurchased ? (
                  <Button 
                    size={isMobile ? "sm" : "default"}
                    onClick={handleAddToCart} 
                    variant={beatInCart ? "outline" : "secondary"}
                    className="flex-1 sm:flex-none rounded-full"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {beatInCart ? 'View Cart' : 'Add to Cart'}
                  </Button>
                ) : (
                  <Button 
                    size={isMobile ? "sm" : "default"}
                    variant="outline"
                    className="flex-1 sm:flex-none rounded-full"
                    onClick={() => toast.success('You already own this beat')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                )}
                
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleFavorite}
                  className={cn(
                    "h-9 w-9 rounded-full",
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
                  className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <Share2 size={18} />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Beat Details Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Tags Section */}
            {beat.tags && beat.tags.length > 0 && (
              <div className="bg-card/50 rounded-xl border p-4 shadow-sm">
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Tag size={14} className="mr-2 text-primary/70" />
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {beat.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="rounded-full text-xs py-0.5">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* License Info */}
            <div className="bg-card/50 rounded-xl border p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Info size={14} className="mr-2 text-primary/70" />
                License
              </h3>
              <p className="text-xs text-muted-foreground">{beat.license_type || 'Standard License'}</p>
            </div>
          </div>
          
          {/* Description */}
          {beat.description && (
            <div className="bg-card/50 rounded-xl border p-4 shadow-sm mt-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{beat.description}</p>
            </div>
          )}
          
          {/* Pricing & Licenses Section */}
          <div className="bg-card rounded-xl border shadow-sm mt-4 overflow-hidden">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Pricing and Licenses</h2>
            </div>
            
            <div className="divide-y">
              {/* Free Download Option */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Free Download</h3>
                  <p className="text-xs text-muted-foreground">Limited usage rights</p>
                </div>
                <Button size="sm" variant="outline" className="rounded-full">
                  <Download size={16} className="mr-1" /> Download
                </Button>
              </div>
              
              {/* Basic License */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Basic License</h3>
                  <p className="text-xs text-muted-foreground">MP3 format • Non-commercial use</p>
                  <Link to="#" className="text-xs text-primary hover:underline">License Terms</Link>
                </div>
                <div className="flex flex-col items-end">
                  <PriceTag
                    localPrice={beat.price_local * 0.5}
                    diasporaPrice={beat.price_diaspora * 0.5}
                    size="md"
                    className="mb-1"
                  />
                  <Button size="sm" className="rounded-full">
                    <ShoppingCart size={14} className="mr-1" /> Add to Cart
                  </Button>
                </div>
              </div>
              
              {/* Premium License */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Premium License</h3>
                  <p className="text-xs text-muted-foreground">WAV format • Commercial use</p>
                  <Link to="#" className="text-xs text-primary hover:underline">License Terms</Link>
                </div>
                <div className="flex flex-col items-end">
                  <PriceTag
                    localPrice={beat.price_local}
                    diasporaPrice={beat.price_diaspora}
                    size="md"
                    className="mb-1"
                  />
                  <Button size="sm" variant="secondary" className="rounded-full">
                    <ShoppingCart size={14} className="mr-1" /> Add to Cart
                  </Button>
                </div>
              </div>
              
              {/* Exclusive License */}
              <div className="p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Exclusive License</h3>
                  <p className="text-xs text-muted-foreground">WAV + Trackout • Full ownership</p>
                  <Link to="#" className="text-xs text-primary hover:underline">License Terms</Link>
                </div>
                <div className="flex flex-col items-end">
                  <PriceTag
                    localPrice={beat.price_local * 3}
                    diasporaPrice={beat.price_diaspora * 3}
                    size="md"
                    className="mb-1"
                  />
                  <Button size="sm" variant="secondary" className="rounded-full">
                    <ShoppingCart size={14} className="mr-1" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Similar Beats */}
          {similarBeats.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-bold mb-3">Similar Beats</h3>
              <div className="space-y-2">
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
    </MainLayoutWithPlayer>
  );
};

export default BeatDetail;
