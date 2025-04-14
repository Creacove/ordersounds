
import { useState } from 'react';
import { useFollows } from '@/hooks/useFollows';
import { BeatCardCompact } from '@/components/marketplace/BeatCardCompact';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/library/EmptyState';
import { usePlayer } from '@/context/PlayerContext';
import { toast } from 'sonner';
import { useUniqueNotifications } from '@/hooks/useUniqueNotifications';
import { Beat } from '@/types';

export function RecommendedBeats() {
  const { user } = useAuth();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeats, isLoading } = useRecommendedBeats();
  const [viewAll, setViewAll] = useState(false);
  const { playBeat } = usePlayer();
  const { isDuplicate, addNotification } = useUniqueNotifications();
  
  // If not logged in, don't show anything
  if (!user) {
    return null;
  }
  
  // Show a loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="mx-0 px-6 md:px-8 my-6">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mt-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // If no recommended beats, don't show the section
  if (!recommendedBeats || recommendedBeats.length === 0) {
    return (
      <div className="mx-0 px-6 md:px-8 my-6">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <div>
          <EmptyState
            icon={Sparkles}
            title="No recommendations yet"
            description="Follow producers to get personalized beat recommendations"
            actionLabel="Discover Producers"
            actionHref="/producers"
          />
        </div>
      </div>
    );
  }
  
  // Determine how many beats to show
  const beatsToShow = viewAll ? recommendedBeats : recommendedBeats.slice(0, 5);
  
  const handleAddToCart = (beatId: string, beatTitle: string) => {
    // Prevent duplicate toast notifications
    if (!isDuplicate(`added-to-cart-${beatId}`)) {
      toast.success(`Added ${beatTitle} to cart`);
      addNotification(`added-to-cart-${beatId}`, `Added ${beatTitle} to cart`, 'success');
    }
  };
  
  // Helper function to get producer name
  const getProducerName = (beat: any) => {
    // Check for the producer object first
    if (beat.producer) {
      return beat.producer.full_name || beat.producer.stage_name || 'Producer';
    }
    
    // Check for the users object (backward compatibility)
    if (beat.users) {
      return beat.users.full_name || beat.users.stage_name || 'Producer';
    }
    
    // Fallback to direct properties
    if (beat.full_name) return beat.full_name;
    if (beat.producer_name) return beat.producer_name;
    
    return 'Producer';
  };
  
  return (
    <div className="mx-0 px-6 md:px-8 my-6">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        {recommendedBeats.length > 5 && (
          <Button 
            variant="ghost" 
            onClick={() => setViewAll(!viewAll)}
            className="text-sm"
          >
            {viewAll ? 'Show Less' : 'View All'}
          </Button>
        )}
      </div>
      
      {/* Desktop view: Modern table layout without column headers */}
      <div className="hidden md:block rounded-xl border bg-card overflow-hidden mt-3 shadow-sm">
        <div className="max-h-[400px] overflow-y-auto">
          {beatsToShow.map((beat, index) => (
            <Link
              key={beat.id}
              to={`/beat/${beat.id}`}
              className={cn(
                "flex items-center px-4 py-3 hover:bg-muted/50 cursor-pointer group transition-colors",
                index !== 0 && "border-t border-border"
              )}
            >
              <div className="flex-1 flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-md bg-muted flex-shrink-0">
                  {beat.cover_image ? (
                    <img 
                      src={beat.cover_image} 
                      alt={beat.title} 
                      className="w-full h-full object-cover rounded-md"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 rounded-md">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                  )}
                </div>
                <div className="truncate">
                  <div className="font-medium truncate">{beat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {beat.license_type ? `${beat.license_type} License` : 'Basic License'}
                  </div>
                </div>
              </div>
              
              <div className="w-1/4 truncate text-sm px-2">
                {getProducerName(beat)}
              </div>
              
              <div className="w-1/6 truncate text-sm capitalize px-2">
                {beat.genre?.toLowerCase() || 'Various'}
              </div>
              
              <div className="w-[60px] text-center text-sm px-2">
                {beat.bpm || '-'}
              </div>
              
              <div className="w-[80px] text-right flex items-center justify-end">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 rounded-full hover:bg-primary/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add to cart functionality
                    handleAddToCart(beat.id, beat.title);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile view: Grid of BeatCardCompact */}
      <div className="grid grid-cols-2 gap-2 md:hidden mt-3">
        {beatsToShow.map((beat) => {
          // Create a complete Beat object that satisfies the Beat type
          const completeBeat: Beat = {
            id: beat.id,
            title: beat.title,
            producer_id: beat.producer_id,
            producer_name: getProducerName(beat),
            cover_image_url: beat.cover_image || '',
            preview_url: beat.audio_preview || '',
            full_track_url: beat.audio_file || '',
            genre: beat.genre || '',
            track_type: beat.track_type || '',
            bpm: beat.bpm || 0,
            tags: beat.tags || [],
            description: beat.description || '',
            created_at: beat.upload_date || new Date().toISOString(),
            updated_at: beat.updated_at || new Date().toISOString(),
            favorites_count: beat.favorites_count || 0,
            purchase_count: beat.purchase_count || 0,
            status: beat.status || 'published',
            is_featured: beat.is_featured || false,
            license_type: beat.license_type || 'basic',
            license_terms: beat.license_terms || '',
            basic_license_price_local: beat.basic_license_price_local || 0,
            basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
            premium_license_price_local: beat.premium_license_price_local || 0,
            premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
            exclusive_license_price_local: beat.exclusive_license_price_local || 0,
            exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
            plays: beat.plays || 0,
            key: beat.key || '',
            duration: beat.duration || '0:00',
            custom_license_price_local: beat.custom_license_price_local,
            custom_license_price_diaspora: beat.custom_license_price_diaspora
          };
          
          return (
            <BeatCardCompact 
              key={beat.id} 
              beat={completeBeat}
            />
          );
        })}
      </div>
      
      {recommendedBeats.length > 5 && viewAll && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={() => setViewAll(false)}
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper function for conditional className combining
const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};
