
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFollows } from '@/hooks/useFollows';
import { formatCurrency } from '@/utils/formatters';
import { Music, Play } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { BeatCardCompact } from '@/components/marketplace/BeatCardCompact';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

export function RecommendedBeats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeats, isLoading } = useRecommendedBeats();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { playBeat } = usePlayer();

  useEffect(() => {
    // Only show recommendations if we have user and beats
    if (user && recommendedBeats && recommendedBeats.length > 0) {
      setShowRecommendations(true);
    } else {
      setShowRecommendations(false);
    }
  }, [user, recommendedBeats]);

  if (!showRecommendations) {
    return null; // Don't render anything if there are no recommendations
  }

  const handlePlayBeat = (beat: any) => {
    if (playBeat && beat) {
      playBeat(beat);
    }
  };

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  // Helper to get producer name from beat data
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
    <div className="mb-6 px-6 md:px-8 pb-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">From Producers You Follow</h2>
        <Button 
          variant="link" 
          size="sm" 
          className="text-sm font-medium" 
          onClick={() => navigate('/producers')}
        >
          View All Producers
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <>
          {/* Desktop view: Table layout */}
          <div className="hidden md:block">
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground bg-muted px-4 py-2.5">
                <div className="col-span-5">TITLE</div>
                <div className="col-span-3">PRODUCER</div>
                <div className="col-span-2">GENRE</div>
                <div className="col-span-1 text-center">BPM</div>
                <div className="col-span-1 text-right">PRICE</div>
              </div>
              
              <ScrollArea className="max-h-[320px]">
                {recommendedBeats?.slice(0, 5).map((beat) => (
                  <div 
                    key={beat.id} 
                    className="grid grid-cols-12 items-center px-4 py-3 hover:bg-muted/50 border-t border-border cursor-pointer group transition-colors"
                    onClick={() => handleBeatClick(beat.id)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayBeat(beat);
                          }}
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
                    <div className="col-span-3 truncate text-sm">
                      {getProducerName(beat)}
                    </div>
                    <div className="col-span-2 truncate text-sm capitalize">
                      {beat.genre?.toLowerCase() || 'Various'}
                    </div>
                    <div className="col-span-1 text-center text-sm">
                      {beat.bpm || '-'}
                    </div>
                    <div className="col-span-1 text-right font-medium text-sm">
                      {formatCurrency(beat.basic_license_price_local || 0, 'NGN')}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          
          {/* Mobile view: Card grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden mt-3">
            {recommendedBeats?.slice(0, 4).map((beat) => (
              <BeatCardCompact 
                key={beat.id} 
                beat={{
                  id: beat.id,
                  title: beat.title,
                  producer_id: beat.producer_id,
                  producer_name: getProducerName(beat),
                  cover_image_url: beat.cover_image || '',
                  basic_license_price_local: beat.basic_license_price_local || 0,
                  basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
                  genre: beat.genre || '',
                  created_at: beat.upload_date || '',
                  favorites_count: beat.favorites_count || 0,
                  purchase_count: beat.purchase_count || 0,
                  plays: beat.plays || 0,
                  preview_url: beat.audio_preview || '',
                  full_track_url: beat.audio_file || '',
                  bpm: beat.bpm || 0,
                  track_type: beat.track_type || '',
                  tags: beat.tags || [],
                  status: (beat.status as 'draft' | 'published') || 'published',
                }} 
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
