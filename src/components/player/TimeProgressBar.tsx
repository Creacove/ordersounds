
import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader } from 'lucide-react';

interface TimeProgressBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  isMobile: boolean;
  error?: boolean;
  loading?: boolean;
  onRetry?: () => void;
}

export function TimeProgressBar({ 
  currentTime, 
  duration, 
  seek, 
  isMobile, 
  error = false,
  loading = false,
  onRetry
}: TimeProgressBarProps) {
  const [progress, setProgress] = useState(0);

  // Update progress whenever currentTime or duration changes
  useEffect(() => {
    if (duration > 0) {
      const progressValue = (currentTime / duration) * 100;
      setProgress(progressValue);
    }
  }, [currentTime, duration]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Simple loading indicator without error message
  if (loading) {
    return (
      <div className={cn("flex items-center gap-2", isMobile ? "hidden" : "flex")}>
        <span className="text-xs text-amber-500 flex items-center">
          <Loader size={12} className="mr-1 animate-spin" />
          Loading...
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 w-32 md:w-40", isMobile ? "hidden" : "flex")}>
      <span className="text-xs text-muted-foreground min-w-8 text-right">
        {formatTime(currentTime)}
      </span>
      
      <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden group">
        <div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" 
          onClick={(e) => {
            const container = e.currentTarget;
            const rect = container.getBoundingClientRect();
            const clickPosition = e.clientX - rect.left;
            const percentage = clickPosition / rect.width;
            seek(percentage * duration);
          }}
        />
        <input 
          type="range"
          id="audio-progress"
          name="audioProgress"
          min={0}
          max={duration || 0}
          value={currentTime || 0}
          onChange={(e) => seek(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          disabled={duration <= 0 || loading}
          aria-label="Audio progress"
        />
      </div>
      
      <span className="text-xs text-muted-foreground min-w-8">
        {formatTime(duration)}
      </span>
    </div>
  );
}
