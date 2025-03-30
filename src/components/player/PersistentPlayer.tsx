
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
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
    clearQueue,
    nextTrack,
    previousTrack
  } = usePlayer();
  
  const isMobile = useIsMobile();

  // Even when no beat is selected, we render a hidden player to maintain the layout
  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-50" />;
  }

  // Handle clicking on the top progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    seek(percentage * duration);
  };

  // Player is now at z-50, above the sidebar which will be at z-40
  const playerClassName = cn(
    "fixed left-0 right-0 bg-card border-t border-border shadow-lg z-50",
    isMobile ? "bottom-16" : "bottom-0" // Position above mobile nav when on mobile
  );

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={playerClassName}>
      {/* Spotify-like progress bar at the very top of the player */}
      <div 
        className="w-full h-1 bg-muted relative cursor-pointer"
        onClick={handleProgressBarClick}
      >
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
        <input 
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
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
        <div className={`flex items-center gap-2 ${isMobile ? 'ml-auto' : 'justify-center flex-1'}`}>
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={previousTrack}
            >
              <SkipBack size={16} />
            </Button>
          )}
          
          <Button 
            variant="default" 
            size="icon" 
            className="h-10 w-10 rounded-full bg-primary" 
            onClick={togglePlay}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full"
              onClick={nextTrack}
            >
              <SkipForward size={16} />
            </Button>
          )}
        </div>
        
        {/* Time and volume controls (only visible on desktop) */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-4 w-1/3 justify-end">
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
