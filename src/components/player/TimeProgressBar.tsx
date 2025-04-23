
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, RefreshCw } from 'lucide-react';

interface TimeProgressBarProps {
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  isMobile: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function TimeProgressBar({ 
  currentTime, 
  duration, 
  seek, 
  isMobile,
  error = false,
  onRetry
}: TimeProgressBarProps) {
  const [formattedCurrent, setFormattedCurrent] = useState('0:00');
  const [formattedDuration, setFormattedDuration] = useState('0:00');
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    // Format current time
    setFormattedCurrent(formatTime(currentTime));
    
    // Format duration and determine loading state
    if (duration > 0) {
      setFormattedDuration(formatTime(duration));
      setIsLoading(false);
    } else if (!error) {
      setIsLoading(true);
    }
  }, [currentTime, duration, error]);

  const formatTime = (time: number) => {
    if (isNaN(time) || time <= 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRetryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRetry) {
      onRetry();
    }
  };

  return (
    <div className={cn("flex items-center gap-2 w-32 md:w-40", isMobile ? "hidden" : "flex")}>
      <span className="text-xs text-muted-foreground min-w-8 text-right">
        {formattedCurrent}
      </span>
      
      <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden group">
        {error ? (
          <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center cursor-pointer" onClick={handleRetryClick}>
            <span className="text-[8px] text-destructive font-medium flex items-center gap-1">
              <RefreshCw size={8} className="animate-pulse" /> RETRY
            </span>
          </div>
        ) : (
          <>
            <div 
              className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" 
              onClick={(e) => {
                if (duration > 0) {
                  const container = e.currentTarget;
                  const rect = container.getBoundingClientRect();
                  const clickPosition = e.clientX - rect.left;
                  const percentage = clickPosition / rect.width;
                  seek(percentage * duration);
                }
              }}
            />
            <input 
              type="range"
              min={0}
              max={duration || 0}
              value={currentTime}
              disabled={duration <= 0}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </>
        )}
      </div>
      
      <span className="text-xs text-muted-foreground min-w-8">
        {error ? (
          <RefreshCw size={12} className="text-destructive cursor-pointer" onClick={handleRetryClick} />
        ) : isLoading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          formattedDuration
        )}
      </span>
    </div>
  );
}
