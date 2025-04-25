
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
    togglePlayPause,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    queue = [], // Default empty array
    removeFromQueue,
    clearQueue,
    nextTrack,
    previousTrack,
    error = false, // Default to false if not provided by context
    reload
  } = usePlayer();
  
  const isMobile = useIsMobile();

  // Even when no beat is selected, we render a hidden player to maintain the layout
  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-50" />;
  }

  // Handle clicking on the top progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (error || duration <= 0) return; // Don't allow seeking if there's an error
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    seek(percentage * duration);
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "fixed left-0 right-0 bg-card border-t border-border shadow-lg z-40",
      isMobile ? "bottom-16" : "bottom-0" // Position above mobile nav when on mobile
    )}>
      {/* Spotify-like progress bar at the very top of the player */}
      <div 
        className={cn(
          "w-full h-1 bg-muted relative cursor-pointer",
          error ? "bg-destructive/30" : "bg-muted"
        )}
        onClick={handleProgressBarClick}
      >
        <div 
          className={cn(
            "h-full transition-all",
            error ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${error ? 100 : progressPercentage}%`, opacity: error ? 0.3 : 1 }}
        />
        {/* Make the input cover the entire area for better touch targets */}
        {!error && (
          <input 
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer"
            style={{ touchAction: "none" }} // Prevents scrolling when swiping on mobile
            disabled={duration <= 0}
          />
        )}
      </div>
      
      <div className="container mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
        {/* Beat info */}
        <div className="flex items-center gap-3 flex-grow md:flex-grow-0 md:w-1/3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
            {currentBeat.cover_image_url ? (
              <img 
                src={currentBeat.cover_image_url}
                alt={currentBeat.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-primary/10">
                <span className="font-medium text-xs text-primary">BEAT</span>
              </div>
            )}
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
            variant={error ? "destructive" : "default"}
            size="icon" 
            className="h-10 w-10 rounded-full" 
            onClick={error && reload ? reload : togglePlayPause}
          >
            {isPlaying && !error ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
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
            <TimeProgressBar 
              currentTime={currentTime} 
              duration={duration} 
              seek={seek} 
              isMobile={isMobile} 
              error={error}
              onRetry={reload}
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
