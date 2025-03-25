
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    nextTrack,
    previousTrack,
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
    "fixed left-0 right-0 bg-card border-t border-border p-3 md:p-4 flex items-center shadow-lg z-40",
    isMobile ? "bottom-16" : "bottom-0" // Position above mobile nav when on mobile
  );

  return (
    <div className={playerClassName}>
      <div className="container mx-auto flex items-center gap-2 md:gap-4">
        {/* Beat info */}
        <div className="flex items-center gap-2 md:gap-3 w-1/4 min-w-[100px]">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0">
            <img 
              src={currentBeat.cover_image_url || '/placeholder.svg'}
              alt={currentBeat.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="overflow-hidden">
            <p className="font-medium text-xs md:text-sm truncate">{currentBeat.title}</p>
            <p className="text-xs text-muted-foreground truncate hidden sm:block">{currentBeat.producer_name}</p>
          </div>
        </div>
        
        {/* Player controls */}
        <div className="flex flex-col items-center flex-grow">
          <div className="flex items-center gap-2 md:gap-4 mb-1 md:mb-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 md:h-8 md:w-8"
                    onClick={previousTrack}
                  >
                    <SkipBack size={16} className="md:size-18" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button 
              variant="default" 
              size="icon" 
              className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary" 
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={18} className="md:size-20" /> : <Play size={18} className="md:size-20" />}
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 md:h-8 md:w-8"
                    onClick={nextTrack}
                    disabled={queue.length === 0}
                  >
                    <SkipForward size={16} className="md:size-18" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* Time progress bar */}
          <TimeProgressBar 
            currentTime={currentTime}
            duration={duration}
            seek={seek}
            isMobile={isMobile}
          />
        </div>
        
        {/* Volume and queue */}
        <div className="flex items-center gap-2 md:gap-4 w-1/6 min-w-[80px] justify-end">
          {/* Volume control */}
          <VolumeControl volume={volume} setVolume={setVolume} />
          
          {/* Queue popover */}
          <QueuePopover 
            queue={queue}
            clearQueue={clearQueue}
            removeFromQueue={removeFromQueue}
          />
        </div>
      </div>
    </div>
  );
}
