
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBeats } from '@/hooks/useBeats';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { Heart, ShoppingCart, Play, Pause, Clock, Music, User, Tag, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { PriceTag } from '@/components/ui/PriceTag';
import { BeatCard } from '@/components/ui/BeatCard';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Beat } from '@/types';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function BeatDetail() {
  const { beatId } = useParams<{ beatId: string }>();
  const navigate = useNavigate();
  const [beat, setBeat] = useState<Beat | null>(null);
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const { getBeatById, beats, isFavorite, toggleFavorite } = useBeats();
  const { playBeat, isPlaying, currentBeat, pausePlayback } = usePlayer();
  const { addToCart, isInCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!beatId) return;
    
    const fetchBeatDetails = async () => {
      setLoading(true);
      const currentBeat = getBeatById(beatId);
      
      if (currentBeat) {
        setBeat(currentBeat);
        
        // Find similar beats (same genre or producer)
        const similar = beats
          .filter(b => 
            b.id !== beatId && 
            (b.genre === currentBeat.genre || b.producer_id === currentBeat.producer_id)
          )
          .slice(0, 6);
          
        setSimilarBeats(similar);
      } else {
        toast.error("Beat not found");
        navigate('/');
      }
      
      setLoading(false);
    };
    
    fetchBeatDetails();
  }, [beatId, beats, getBeatById, navigate]);
  
  const handlePlay = () => {
    if (!beat) return;
    
    if (isPlaying && currentBeat?.id === beat.id) {
      pausePlayback();
    } else {
      playBeat(beat);
    }
  };
  
  const handleAddToCart = () => {
    if (!beat) return;
    
    if (!user) {
      toast.error("Please log in to add items to cart");
      return;
    }
    
    addToCart(beat);
    toast.success(`Added "${beat.title}" to cart`);
  };
  
  const handleToggleFavorite = () => {
    if (!beat) return;
    
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }
    
    toggleFavorite(beat.id);
  };
  
  const handleProducerClick = () => {
    if (!beat) return;
    navigate(`/producer/${beat.producer_id}`);
  };
  
  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat?.id;
  const beatInCart = beat ? isInCart(beat.id) : false;

  if (loading) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="animate-pulse w-full max-w-4xl">
              <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-80 h-80 bg-muted rounded"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-1/4 mt-8"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-10 bg-muted rounded w-1/3 mt-8"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  if (!beat) {
    return (
      <MainLayoutWithPlayer>
        <div className="container py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h1 className="text-2xl font-bold">Beat not found</h1>
            <Button onClick={() => navigate('/')} className="mt-4">
              Return to Home
            </Button>
          </div>
        </div>
      </MainLayoutWithPlayer>
    );
  }

  return (
    <MainLayoutWithPlayer>
      <div className="container py-6 md:py-8">
        <Button 
          variant="ghost" 
          className="mb-4 pl-2 text-muted-foreground" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={16} className="mr-1" /> Back
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Beat cover and primary info */}
          <div className="col-span-1">
            <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-square relative">
                <img 
                  src={beat.cover_image_url || '/placeholder.svg'} 
                  alt={beat.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handlePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground hover:scale-110 transition-transform shadow-lg">
                    {isCurrentlyPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </div>
                </button>
              </div>
              
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-1">{beat.title}</h1>
                <button 
                  onClick={handleProducerClick}
                  className="text-primary hover:underline font-medium mb-4 block"
                >
                  {beat.producer_name}
                </button>
                
                <div className="flex justify-between items-center mb-6">
                  <PriceTag
                    localPrice={beat.price_local}
                    diasporaPrice={beat.price_diaspora}
                    size="lg"
                  />
                </div>
                
                <div className="flex gap-2">
                  {!beatInCart ? (
                    <Button 
                      className="flex-1" 
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart size={18} className="mr-2" /> 
                      Buy Now
                    </Button>
                  ) : (
                    <Button 
                      className="flex-1" 
                      variant="outline"
                      onClick={() => navigate('/cart')}
                    >
                      <ShoppingCart size={18} className="mr-2" /> 
                      View in Cart
                    </Button>
                  )}
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={handlePlay}
                          className="h-10 w-10"
                        >
                          {isCurrentlyPlaying ? <Pause size={18} /> : <Play size={18} />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isCurrentlyPlaying ? 'Pause' : 'Play'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={handleToggleFavorite}
                          className={cn(
                            "h-10 w-10",
                            isFavorite(beat.id) && "text-purple-500"
                          )}
                        >
                          <Heart 
                            size={18} 
                            fill={isFavorite(beat.id) ? "currentColor" : "none"} 
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isFavorite(beat.id) ? 'Remove from favorites' : 'Add to favorites'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
          
          {/* Beat details */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg p-5 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Beat Details</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Clock size={14} className="mr-1.5 inline" /> BPM
                  </p>
                  <p className="font-medium">{beat.bpm}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Music size={14} className="mr-1.5 inline" /> Genre
                  </p>
                  <p className="font-medium">{beat.genre}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Tag size={14} className="mr-1.5 inline" /> Type
                  </p>
                  <p className="font-medium">{beat.track_type}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {beat.description && (
                <>
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {beat.description}
                  </p>
                  <Separator className="my-4" />
                </>
              )}
              
              {beat.tags && beat.tags.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {beat.tags.map((tag, idx) => (
                      <Badge key={idx} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Producer info */}
            <div className="bg-card border rounded-lg p-5 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Producer</h2>
              
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-muted overflow-hidden mr-3">
                  <img 
                    src="/placeholder.svg" 
                    alt={beat.producer_name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <button 
                    onClick={handleProducerClick}
                    className="font-medium hover:underline"
                  >
                    {beat.producer_name}
                  </button>
                  <p className="text-sm text-muted-foreground">Producer</p>
                </div>
                <Button 
                  className="ml-auto" 
                  variant="outline" 
                  onClick={handleProducerClick}
                >
                  View Profile
                </Button>
              </div>
            </div>
            
            {/* License terms if available */}
            {beat.license_terms && (
              <div className="bg-card border rounded-lg p-5 shadow-sm">
                <h2 className="text-lg font-medium mb-4">License Information</h2>
                <div className="space-y-1 mb-3">
                  <p className="text-sm text-muted-foreground">License Type</p>
                  <p className="font-medium">{beat.license_type || 'Standard'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Terms</p>
                  <p className="text-sm">{beat.license_terms}</p>
                </div>
              </div>
            )}
            
            {/* Share link */}
            <div className="bg-card border rounded-lg p-5 shadow-sm">
              <h2 className="text-lg font-medium mb-4">Share Beat</h2>
              <div className="flex items-center">
                <input 
                  type="text" 
                  readOnly 
                  value={window.location.href}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mr-2 flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied to clipboard");
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Similar beats section */}
        {similarBeats.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">You might also like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarBeats.map(similarBeat => (
                <BeatCard 
                  key={similarBeat.id} 
                  beat={similarBeat}
                  isFavorite={isFavorite(similarBeat.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
