
import React from 'react';
import { cn } from '@/lib/utils';

interface TimeProgressBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  isMobile: boolean;
}

export function TimeProgressBar({ currentTime, duration, seek, isMobile }: TimeProgressBarProps) {
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle clicking directly on the progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    seek(percentage * duration);
  };

  return (
    <div className={cn("flex items-center gap-2 w-32 md:w-40", isMobile ? "hidden" : "flex")}>
      <span className="text-xs text-muted-foreground min-w-8 text-right">
        {formatTime(currentTime)}
      </span>
      
      <div 
        className="relative w-full h-1 bg-muted rounded-full overflow-hidden group cursor-pointer"
        onClick={handleProgressBarClick}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
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
      
      <span className="text-xs text-muted-foreground min-w-8">
        {formatTime(duration)}
      </span>
    </div>
  );
}
