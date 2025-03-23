
import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { cn } from '@/lib/utils';
import { 
  Play, 
  Pause, 
  Volume1, 
  Volume2,
  VolumeX,
  SkipForward,
  SkipBack,
  ListMusic,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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
    queue,
    removeFromQueue,
    clearQueue
  } = usePlayer();

  // Even when no beat is selected, we render a hidden player to maintain the layout
  if (!currentBeat) {
    return <div className="fixed bottom-0 left-0 right-0 h-0 z-50" />; // Take no space but ensure it's in the DOM
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const VolumeIcon = volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 md:p-4 flex items-center z-50 shadow-lg">
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
          
          <div className="flex items-center gap-1 md:gap-2 w-full max-w-lg">
            <span className="text-xs text-muted-foreground w-8 md:w-10 text-right hidden xs:block">
              {formatTime(currentTime)}
            </span>
            
            <div className="relative w-full h-1 bg-muted rounded-full">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${(currentTime / duration) * 100}%` }}
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
            
            <span className="text-xs text-muted-foreground w-8 md:w-10 hidden xs:block">
              {formatTime(duration)}
            </span>
          </div>
        </div>
        
        {/* Volume and queue */}
        <div className="flex items-center gap-2 md:gap-4 w-1/6 min-w-[80px] justify-end">
          <div className="flex items-center gap-1 md:gap-2 sm:w-20 hidden sm:flex">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 md:h-8 md:w-8" 
              onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
            >
              <VolumeIcon size={16} className="md:size-18" />
            </Button>
            
            <div className="relative w-full h-1 bg-muted rounded-full">
              <div 
                className="absolute top-0 left-0 h-full bg-primary rounded-full"
                style={{ width: `${volume * 100}%` }}
              />
              <input 
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-7 w-7 md:h-8 md:w-8",
                  queue.length > 0 && "text-primary"
                )}
              >
                <ListMusic size={16} className="md:size-18" />
                {queue.length > 0 && (
                  <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center">
                    {queue.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 md:w-80 p-0" align="end">
              <div className="p-2 border-b border-border flex justify-between items-center">
                <h4 className="font-medium text-sm">Queue ({queue.length})</h4>
                {queue.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearQueue}
                    className="h-7 text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              {queue.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Your queue is empty
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {queue.map((beat, index) => (
                    <div 
                      key={beat.id} 
                      className="flex items-center gap-2 p-2 hover:bg-muted/50"
                    >
                      <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                        <img 
                          src={beat.cover_image_url || '/placeholder.svg'}
                          alt={beat.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-grow overflow-hidden">
                        <p className="text-sm truncate">{beat.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{beat.producer_name}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-70 hover:opacity-100" 
                        onClick={() => removeFromQueue(beat.id)}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
