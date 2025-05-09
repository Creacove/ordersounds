
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
import { SupabaseBeat } from '@/services/beats/types';
import { Beat } from '@/types';
import { mapSupabaseBeat } from '@/lib/supabase';

export function RecommendedBeats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeatsData, isLoading } = useRecommendedBeats();
  const [showRecommendations, setShowRecommendations] = useState(false);
  const { playBeat } = usePlayer();
  
  // Safely cast the data and ensure we have a valid array
  const recommendedBeats: SupabaseBeat[] = Array.isArray(recommendedBeatsData) 
    ? recommendedBeatsData as SupabaseBeat[] 
    : [];

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

  // Type safe handler with proper conversion to Beat object
  const handlePlayBeat = (beat: SupabaseBeat) => {
    if (playBeat && beat) {
      // Convert SupabaseBeat to Beat type if needed
      const beatForPlayer: Beat = {
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
        status: (beat.status as 'draft' | 'published') || 'published',
        created_at: beat.upload_date || new Date().toISOString(),
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        plays: beat.plays || 0
      };
      
      playBeat(beatForPlayer);
    }
  };

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };

  // Helper to get producer name from beat data
  const getProducerName = (beat: SupabaseBeat): string => {
    // Check for the users object first (backward compatibility)
    if (beat.users && typeof beat.users === 'object') {
      if (beat.users.full_name) return beat.users.full_name;
      if (beat.users.stage_name) return beat.users.stage_name;
    }
    
    // Fallback to direct properties
    if (beat.producer_id) return `Producer ${beat.producer_id.substring(0, 8)}`;
    
    return 'Unknown Producer';
  };

  return (
    <div className="mb-6 px-6 md:px-8 pb-4">
      <div className="flex justify-between items-center mb-4">
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
          {/* Desktop view: Modern table layout without column headers */}
          <div className="hidden md:block">
            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
              <ScrollArea className="max-h-[320px]">
                {recommendedBeats.slice(0, 5).map((beat, index) => (
                  <div 
                    key={beat.id} 
                    className={cn(
                      "flex items-center px-4 py-3 hover:bg-muted/50 cursor-pointer group transition-colors",
                      index !== 0 && "border-t border-border"
                    )}
                    onClick={() => handleBeatClick(beat.id)}
                  >
                    <div className="flex-1 flex items-center gap-3 min-w-0">
                      <div className="relative w-10 h-10 rounded-md bg-muted flex-shrink-0">
                        {beat.cover_image ? (
                          <img 
                            src={beat.cover_image} 
                            alt={beat.title} 
                            className="w-full h-full object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10 rounded-md">
                            <Music className="h-5 w-5 text-primary" />
                          </div>
                        )}
                        <button 
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 rounded-md transition-opacity"
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
                    
                    <div className="w-1/4 truncate text-sm px-2">
                      {getProducerName(beat)}
                    </div>
                    
                    <div className="w-1/6 truncate text-sm capitalize px-2">
                      {beat.genre?.toLowerCase() || 'Various'}
                    </div>
                    
                    <div className="w-[60px] text-center text-sm px-2">
                      {beat.bpm || '-'}
                    </div>
                    
                    <div className="w-[80px] text-right font-medium text-sm">
                      {formatCurrency(beat.basic_license_price_local || 0, 'NGN')}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
          
          {/* Mobile view: Card grid */}
          <div className="grid grid-cols-2 gap-4 md:hidden mt-3">
            {recommendedBeats.slice(0, 4).map((beat) => (
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
