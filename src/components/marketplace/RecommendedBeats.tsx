
import { useState } from 'react';
import { useFollows } from '@/hooks/useFollows';
import { BeatCard } from '@/components/marketplace/BeatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Sparkles, ShoppingCart } from 'lucide-react';
import { EmptyState } from '@/components/library/EmptyState';
import { usePlayer } from '@/context/PlayerContext';
import { formatCurrency } from '@/utils/formatters';
import { Play, Music, Clock } from 'lucide-react';

export function RecommendedBeats() {
  const { user } = useAuth();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeats, isLoading } = useRecommendedBeats();
  const [viewAll, setViewAll] = useState(false);
  const { playBeat } = usePlayer();
  
  // If not logged in, don't show anything
  if (!user) {
    return null;
  }
  
  // Show a loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="my-8">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // If no recommended beats, don't show the section
  if (!recommendedBeats || recommendedBeats.length === 0) {
    return (
      <div className="my-8">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Follow producers to get personalized beat recommendations"
          actionLabel="Discover Producers"
          actionHref="/producers"
        />
      </div>
    );
  }
  
  // Determine how many beats to show
  const beatsToShow = viewAll ? recommendedBeats : recommendedBeats.slice(0, 5);

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };
  
  const handlePlayBeat = (beat: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (playBeat) {
      playBeat(beat);
    }
  };
  
  return (
    <div className="my-8">
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
      
      {/* Desktop view: Table layout */}
      <div className="hidden md:block rounded-lg border bg-card overflow-hidden mt-4">
        <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground bg-muted px-4 py-2.5">
          <div className="col-span-5">TITLE</div>
          <div className="col-span-2">PRODUCER</div>
          <div className="col-span-2">GENRE</div>
          <div className="col-span-1 text-center">BPM</div>
          <div className="col-span-1 text-center">TIME</div>
          <div className="col-span-1 text-right">PRICE</div>
        </div>
        
        <div className="max-h-[400px] overflow-y-auto">
          {beatsToShow.map((beat) => (
            <Link
              key={beat.id}
              to={`/beat/${beat.id}`}
              className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/50 border-t border-border cursor-pointer group transition-colors"
            >
              <div className="col-span-5 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded bg-muted flex-shrink-0">
                  {beat.cover_image ? (
                    <img 
                      src={beat.cover_image} 
                      alt={beat.title} 
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <button 
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded transition-opacity"
                    onClick={(e) => handlePlayBeat(beat, e)}
                  >
                    <Play className="h-5 w-5 text-white" fill="white" />
                  </button>
                </div>
                <div className="truncate">
                  <div className="font-medium truncate">{beat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {beat.license_type ? `${beat.license_type} License` : 'Basic License'}
                  </div>
                </div>
              </div>
              <div className="col-span-2 truncate text-sm">
                {beat.producer_name || beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer'}
              </div>
              <div className="col-span-2 truncate text-sm capitalize">
                {beat.genre?.toLowerCase() || 'Various'}
              </div>
              <div className="col-span-1 text-center text-sm">
                {beat.bpm || '-'}
              </div>
              <div className="col-span-1 text-center text-sm flex items-center justify-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span>{formatDuration(beat.duration || 0)}</span>
              </div>
              <div className="col-span-1 text-right flex items-center justify-end gap-2">
                <span className="font-medium text-sm">
                  {formatCurrency(beat.basic_license_price_local || beat.basic_local || 0)}
                </span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 rounded-full hover:bg-primary/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Add to cart functionality would go here
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile view: Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden mt-4">
        {beatsToShow.map((beat) => (
          <BeatCard 
            key={beat.id} 
            beat={{
              id: beat.id,
              title: beat.title,
              producer_id: beat.producer_id,
              producer_name: beat.users?.stage_name || beat.users?.full_name || "Unknown Producer",
              cover_image_url: beat.cover_image,
              basic_license_price_local: beat.basic_license_price_local || beat.basic_local || 0,
              genre: beat.genre || '',
              created_at: beat.created_at || '',
              favorites_count: beat.favorites_count || 0,
              purchase_count: beat.purchase_count || 0,
              plays: beat.plays || 0,
              preview_url: beat.preview_url || beat.audio_preview || '',
              full_track_url: beat.full_track_url || beat.audio_file || '',
              bpm: beat.bpm || 0,
              track_type: beat.track_type || '',
              tags: beat.tags || [],
              status: beat.status || 'published',
            }} 
          />
        ))}
      </div>
      
      {recommendedBeats.length > 5 && viewAll && (
        <div className="flex justify-center mt-6">
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
