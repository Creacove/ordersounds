import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Play, Pause, Heart, Download, ShoppingCart, 
  Share2, ArrowLeft, Music, Info, Tag, Clock, User, Globe, AudioWaveform
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
import { getLicensePrice } from '@/utils/licenseUtils';

const BeatDetail = () => {
  const { beatId } = useParams<{ beatId: string }>();
  const { getBeatById, toggleFavorite, isFavorite, isPurchased, beats } = useBeats();
  const { isPlaying, currentBeat, playBeat, togglePlayPause } = usePlayer();
  const { addToCart, isInCart } = useCart();
  const { user, currency } = useAuth();
  const navigate = useNavigate();
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const [selectedLicense, setSelectedLicense] = useState<string>('basic');
  const isMobile = useIsMobile();
  
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

  useEffect(() => {
    if (beat?.license_type) {
      setSelectedLicense(beat.license_type);
    }
  }, [beat]);

  const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat?.id;
  const isBeatFavorite = beat ? isFavorite(beat.id) : false;
  const isBeatPurchased = beat ? isPurchased(beat.id) : false;
  const beatInCart = beat ? isInCart(beat.id) : false;

  useEffect(() => {
    if (beat && beats && beats.length > 0) {
      const producerBeats = beats
        .filter(b => b.producer_id === beat.producer_id && b.id !== beat.id)
        .slice(0, 2);
      
      const genreBeats = beats
        .filter(b => b.genre === beat.genre && b.id !== beat.id && !producerBeats.some(pb => pb.id === b.id))
        .slice(0, 2);
      
      const bpmBeats = beats
        .filter(b => 
          Math.abs(b.bpm - beat.bpm) <= 5 && 
          b.id !== beat.id && 
          !producerBeats.some(pb => pb.id === b.id) && 
          !genreBeats.some(gb => gb.id === b.id)
        )
        .slice(0, 2);
      
      setSimilarBeats([...producerBeats, ...genreBeats, ...bpmBeats].slice(0, 5));
    }
  }, [beat, beats]);

  const handlePlay = (similarBeat?: Beat) => {
    if (similarBeat) {
      playBeat(similarBeat);
      return;
    }
    
    if (beat) {
      if (isCurrentlyPlaying) {
        togglePlayPause();
      } else {
        playBeat(beat);
      }
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

  const handleAddToCart = (licenseType: string) => {
    if (!beat) return;
    
    if (!user) {
      toast.error('Please log in to add to cart');
      navigate('/login');
      return;
    }

    if (isBeatPurchased) {
      toast.success('You already own this beat');
      return;
    }

    if (isInCart(beat.id)) {
      navigate('/cart');
      return;
    }

    const beatWithLicense = {
      ...beat,
      selected_license: licenseType
    };
    
    addToCart(beatWithLicense);
    toast.success(`Added "${beat.title}" (${licenseType} license) to cart`);
  };

  const handleShare = () => {
    if (navigator.share && beat) {
      navigator.share({
        title: `${beat.title} by ${beat.producer_name}`,
        text: `Check out this beat: ${beat.title} by ${beat.producer_name}`,
        url: window.location.href,
      }).catch(err => {
        console.error('Could not share:', err);
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleSelectLicense = (licenseType: string) => {
    setSelectedLicense(licenseType);
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

  const hasBasicLicense = beat?.basic_license_price_local !== undefined || beat?.basic_license_price_diaspora !== undefined;
  const hasPremiumLicense = beat?.premium_license_price_local !== undefined || beat?.premium_license_price_diaspora !== undefined;
  const hasExclusiveLicense = beat?.exclusive_license_price_local !== undefined || beat?.exclusive_license_price_diaspora !== undefined;
  const hasCustomLicense = beat?.license_type && !['basic', 'premium', 'exclusive'].includes(beat.license_type);
  
  const availableLicenseTypes = beat?.license_type ? beat.license_type.split(',') : ['basic'];

  return (
    <MainLayoutWithPlayer>
      <div className="relative">
        <div className="absolute top-0 inset-x-0 h-[20vh] bg-gradient-to-b from-primary/20 to-background -z-10" />
        
        <div className="container max-w-4xl py-4 md:py-6 px-4">
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
          
          <div className="rounded-xl bg-card/50 backdrop-blur-sm border shadow-sm overflow-hidden mb-4">
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-start gap-3 mb-2">
                <div 
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg overflow-hidden flex-shrink-0 border shadow-sm"
                  onClick={() => handlePlay()}
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
                    {beat.key && (
                      <>
                        <span className="text-xs text-muted-foreground mx-1">•</span>
                        <span className="text-xs text-muted-foreground">
                          Key: {beat.key}
                        </span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground mx-1">•</span>
                    <span className="text-xs text-muted-foreground">
                      {beat.track_type}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 my-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Globe size={12} className="text-primary/70" /> {beat.purchase_count || 0} downloads
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User size={12} className="text-primary/70" /> {beat.favorites_count || 0} likes
                </span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <AudioWaveform size={12} className="text-primary/70" /> {beat.plays || 0} plays
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <Button 
                  size={isMobile ? "sm" : "default"}
                  onClick={() => handlePlay()}
                  className="flex-none sm:flex-none rounded-full"
                  variant={isCurrentlyPlaying ? "secondary" : "default"}
                >
                  {isCurrentlyPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isCurrentlyPlaying ? 'Pause' : 'Play'}
                </Button>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleFavorite(beat.id)}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
            
            <div className="bg-card/50 rounded-xl border p-4 shadow-sm">
              <h3 className="text-sm font-medium mb-2 flex items-center">
                <Info size={14} className="mr-2 text-primary/70" />
                License Options
              </h3>
              <p className="text-xs text-muted-foreground">
                {availableLicenseTypes.length > 1 
                  ? `Available licenses: ${availableLicenseTypes.map(lt => lt.charAt(0).toUpperCase() + lt.slice(1)).join(', ')}`
                  : 'Choose from basic, premium, or exclusive licenses with different rights and features.'}
              </p>
            </div>
          </div>
          
          {beat.description && (
            <div className="bg-card/50 rounded-xl border p-4 shadow-sm mt-4">
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{beat.description}</p>
            </div>
          )}
          
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-3">Choose a License</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(availableLicenseTypes.includes('basic') || !hasCustomLicense) && (
                <div className={cn(
                  "relative rounded-xl border shadow-sm overflow-hidden",
                  selectedLicense === 'basic' ? "border-primary/50 bg-primary/5" : "bg-card"
                )}>
                  <div className="p-4">
                    <h3 className="font-semibold">Basic License</h3>
                    <PriceTag 
                      localPrice={getLicensePrice(beat, 'basic', false)}
                      diasporaPrice={getLicensePrice(beat, 'basic', true)}
                      size="lg"
                      className="my-3"
                      onClick={() => handleSelectLicense('basic')}
                    />
                    <ul className="text-xs space-y-2 mt-4 mb-6">
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>MP3 Format</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Non-commercial use</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Up to 5,000 streams</span>
                      </li>
                      <li className="flex items-start gap-2 text-muted-foreground">
                        <div>✕</div>
                        <span>No radio/TV broadcasts</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full rounded-full"
                      size="sm"
                      onClick={() => {
                        handleSelectLicense('basic');
                        handleAddToCart('basic');
                      }}
                      variant={isBeatPurchased ? "outline" : selectedLicense === 'basic' ? "default" : "secondary"}
                      disabled={isBeatPurchased}
                    >
                      {isBeatPurchased ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {(availableLicenseTypes.includes('premium') || !hasCustomLicense) && (
                <div className={cn(
                  "relative rounded-xl border shadow-sm overflow-hidden",
                  selectedLicense === 'premium' ? "border-primary/50 bg-primary/5" : "bg-card"
                )}>
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs py-1 px-3 rounded-bl-lg">
                    Popular
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">Premium License</h3>
                    <PriceTag 
                      localPrice={getLicensePrice(beat, 'premium', false)} 
                      diasporaPrice={getLicensePrice(beat, 'premium', true)}
                      size="lg"
                      className="my-3"
                      onClick={() => handleSelectLicense('premium')}
                    />
                    <ul className="text-xs space-y-2 mt-4 mb-6">
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>WAV Format</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Commercial use</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Unlimited streams</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Limited broadcasting rights</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full rounded-full"
                      size="sm"
                      onClick={() => {
                        handleSelectLicense('premium');
                        handleAddToCart('premium');
                      }}
                      variant={isBeatPurchased ? "outline" : selectedLicense === 'premium' ? "default" : "secondary"}
                      disabled={isBeatPurchased}
                    >
                      {isBeatPurchased ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {(availableLicenseTypes.includes('exclusive') || !hasCustomLicense) && (
                <div className={cn(
                  "relative rounded-xl border shadow-sm overflow-hidden",
                  selectedLicense === 'exclusive' ? "border-primary/50 bg-primary/5" : "bg-card"
                )}>
                  <div className="p-4">
                    <h3 className="font-semibold">Exclusive License</h3>
                    <PriceTag 
                      localPrice={getLicensePrice(beat, 'exclusive', false)} 
                      diasporaPrice={getLicensePrice(beat, 'exclusive', true)}
                      size="lg"
                      className="my-3"
                      onClick={() => handleSelectLicense('exclusive')}
                    />
                    <ul className="text-xs space-y-2 mt-4 mb-6">
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>WAV + Trackout Files</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Full ownership rights</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Unlimited distribution</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="text-primary">✓</div>
                        <span>Full broadcasting rights</span>
                      </li>
                    </ul>
                    <Button 
                      className="w-full rounded-full"
                      size="sm"
                      onClick={() => {
                        handleSelectLicense('exclusive');
                        handleAddToCart('exclusive');
                      }}
                      variant={isBeatPurchased ? "outline" : selectedLicense === 'exclusive' ? "default" : "secondary"}
                      disabled={isBeatPurchased}
                    >
                      {isBeatPurchased ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {availableLicenseTypes.includes('custom') && (
                <div className={cn(
                  "relative rounded-xl border shadow-sm overflow-hidden",
                  selectedLicense === 'custom' ? "border-primary/50 bg-primary/5" : "bg-card"
                )}>
                  <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs py-1 px-3 rounded-bl-lg">
                    Custom
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold capitalize">Custom License</h3>
                    <PriceTag 
                      localPrice={beat?.custom_license_price_local || beat?.price_local || 0} 
                      diasporaPrice={beat?.custom_license_price_diaspora || beat?.price_diaspora || 0}
                      size="lg"
                      className="my-3"
                      licenseType="custom"
                      onClick={() => handleSelectLicense('custom')}
                    />
                    <div className="text-xs mt-4 mb-6">
                      {beat?.license_terms ? (
                        <p className="text-muted-foreground">{beat.license_terms}</p>
                      ) : (
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="text-primary">✓</div>
                            <span>Custom license terms</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="text-primary">✓</div>
                            <span>Contact producer for details</span>
                          </li>
                        </ul>
                      )}
                    </div>
                    <Button 
                      className="w-full rounded-full"
                      size="sm"
                      onClick={() => {
                        handleSelectLicense('custom');
                        handleAddToCart('custom');
                      }}
                      variant={isBeatPurchased ? "outline" : selectedLicense === 'custom' ? "default" : "secondary"}
                      disabled={isBeatPurchased}
                    >
                      {isBeatPurchased ? (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground mt-3">
              <p>All licenses include producer credit. See the full <Link to="/licenses" className="text-primary hover:underline">license terms</Link> for details.</p>
            </div>
          </div>
          
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
                    onPlay={() => handlePlay(similarBeat)}
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
