
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { Play, Pause, SkipBack, SkipForward, Loader } from 'lucide-react';
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
    queue = [],
    removeFromQueue,
    clearQueue,
    nextTrack,
    previousTrack,
    error = false,
    loading = false,
    reload
  } = usePlayer();
  
  const isMobile = useIsMobile();
  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Memoize progress percentage calculation
  const progressPercentage = useMemo(() => {
    if (duration > 0 && !isDragging) {
      const progress = (currentTime / duration) * 100;
      return Math.min(progress, 100);
    }
    return 0;
  }, [currentTime, duration, isDragging]);

  // Optimized progress bar click handler with touch support
  const handleProgressInteraction = useCallback((clientX: number) => {
    if (error || duration <= 0 || loading || !progressRef.current) return;
    
    const container = progressRef.current;
    const rect = container.getBoundingClientRect();
    const clickPosition = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickPosition / rect.width));
    seek(percentage * duration);
  }, [error, duration, loading, seek]);

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    handleProgressInteraction(e.clientX);
  }, [handleProgressInteraction]);

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleProgressInteraction(e.touches[0].clientX);
  }, [handleProgressInteraction]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault();
      handleProgressInteraction(e.touches[0].clientX);
    }
  }, [isDragging, handleProgressInteraction]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentBeat) return;
      
      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(Math.max(0, currentTime - 10));
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(Math.min(duration, currentTime + 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentBeat, togglePlayPause, seek, currentTime, duration]);

  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-50" />;
  }

  const coverImageSrc = currentBeat.cover_image_url || '/placeholder.svg';

  return (
    <div className={cn(
      "fixed left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg z-40 transition-all duration-300",
      isMobile ? "bottom-16" : "bottom-0"
    )}>
      {/* Enhanced progress bar with touch support */}
      <div 
        ref={progressRef}
        className="w-full h-1 bg-muted relative cursor-pointer touch-none"
        onClick={handleProgressBarClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className={cn(
            "h-full transition-all bg-primary",
            loading && "animate-pulse bg-amber-500"
          )}
          style={{ width: `${progressPercentage}%` }}
        />
        
        {/* Invisible overlay for better touch targets */}
        <div className="absolute inset-0 py-2" style={{ touchAction: "none" }} />
      </div>
      
      <div className="container mx-auto px-3 md:px-4 py-2 md:py-3 flex items-center gap-3 md:gap-4">
        {/* Beat info with optimized image loading */}
        <div className="flex items-center gap-2 md:gap-3 flex-grow md:flex-grow-0 md:w-1/3 min-w-0">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded overflow-hidden flex-shrink-0 bg-muted">
            <img 
              src={coverImageSrc}
              alt={currentBeat.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-medium text-sm md:text-base truncate">{currentBeat.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentBeat.producer_name}</p>
          </div>
        </div>
        
        {/* Player controls */}
        <div className={cn(
          "flex items-center gap-1 md:gap-2",
          isMobile ? 'ml-auto' : 'justify-center flex-1'
        )}>
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-muted/50"
              onClick={previousTrack}
              disabled={loading}
            >
              <SkipBack size={16} />
            </Button>
          )}
          
          <Button 
            variant={error ? "destructive" : "default"}
            size="icon" 
            className="h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center shadow-sm" 
            onClick={error && reload ? reload : togglePlayPause}
            disabled={loading && !error}
          >
            {loading ? (
              <Loader size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} className="ml-0.5" />
            )}
          </Button>
          
          {!isMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-muted/50"
              onClick={nextTrack}
              disabled={loading}
            >
              <SkipForward size={16} />
            </Button>
          )}
        </div>
        
        {/* Desktop controls */}
        {!isMobile && (
          <div className="hidden md:flex items-center gap-3 md:gap-4 w-1/3 justify-end">
            <TimeProgressBar 
              currentTime={currentTime} 
              duration={duration} 
              seek={seek} 
              isMobile={isMobile} 
              error={error}
              loading={loading}
              onRetry={reload}
            />
            <VolumeControl volume={volume} setVolume={setVolume} />
            
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
