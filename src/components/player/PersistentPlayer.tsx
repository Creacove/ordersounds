
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { QueuePopover } from './QueuePopover';
import { TimeProgressBar } from './TimeProgressBar';
import { VolumeControl } from './VolumeControl';

export function PersistentPlayer() {
  const {
    currentBeat,
    isPlaying,
    togglePlay,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    queue = [], // Default empty array
    removeFromQueue,
    clearQueue
  } = usePlayer();
  
  const isMobile = useIsMobile();

  // Even when no beat is selected, we render a hidden player to maintain the layout
  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-40" />;
  }

  // Player is always at z-40, below the mobile sidebar which will be at z-50
  const playerClassName = cn(
    "fixed left-0 right-0 bg-card border-t border-border shadow-lg z-40",
    isMobile ? "bottom-16" : "bottom-0" // Position above mobile nav when on mobile
  );

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={playerClassName}>
      {/* Spotify-like progress bar at the very top of the player */}
      <div className="w-full h-1 bg-muted">
        <div 
          className="h-full bg-primary"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
        {/* Beat info */}
        <div className="flex items-center gap-3 flex-grow md:flex-grow-0 md:w-1/3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0">
            <img 
              src={currentBeat.cover_image_url || '/placeholder.svg'}
              alt={currentBeat.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-sm md:text-base truncate">{currentBeat.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentBeat.producer_name}</p>
          </div>
        </div>
        
        {/* Player controls (centered on desktop, right-aligned on mobile) */}
        <div className={`flex items-center ${isMobile ? 'ml-auto' : 'justify-center flex-1'}`}>
          <Button 
            variant="default" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-primary" 
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
        </div>
        
        {/* Time and volume controls (only visible on desktop) */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-4 w-1/3 justify-end">
            <TimeProgressBar 
              currentTime={currentTime}
              duration={duration}
              seek={seek}
              isMobile={isMobile}
            />
            
            <VolumeControl volume={volume} setVolume={setVolume} />
            
            {/* Queue popover */}
            <QueuePopover 
              queue={queue}
              clearQueue={clearQueue}
              removeFromQueue={removeFromQueue}
            />
          </div>
        )}
      </div>
    </div>
  );
}
