import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
  onError?: () => void;
}

export function AudioPlayer({ src, className, compact = false, onError }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previousSrc = useRef<string>('');

  // Reset state when source changes
  useEffect(() => {
    if (src !== previousSrc.current) {
      setCurrentTime(0);
      setActuallyPlaying(false);
      setIsPlaying(false);
      setHasError(false);
      previousSrc.current = src;
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      setHasError(false);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
      
      // If we're getting time updates and current time is advancing, audio is definitely playing
      if (!actuallyPlaying && audio.currentTime > 0.5) {
        setActuallyPlaying(true);
        setIsLoading(false);
      }
    };
    
    const handlePlaying = () => {
      setActuallyPlaying(true);
      setIsPlaying(true);
      setHasError(false);
      setIsLoading(false);
    };
    
    const handlePause = () => {
      setActuallyPlaying(false);
      setIsPlaying(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setActuallyPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error("Error playing audio:", e);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      setActuallyPlaying(false);
      
      if (onError) {
        onError();
      }
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setHasError(false);
    };
    
    const handleWaiting = () => {
      setIsLoading(true);
    };

    // Events
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [onError]);

  // Update source when src prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (audio.src !== src) {
      const wasPlaying = isPlaying;
      audio.pause();
      setIsPlaying(false);
      setActuallyPlaying(false);
      setHasError(false);
      setIsLoading(true);
      
      audio.src = src;
      audio.load();
      
      if (wasPlaying) {
        // Small delay before attempting to play to allow browser to initialize
        setTimeout(() => {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setIsPlaying(true);
              // Don't set actuallyPlaying here - wait for the 'playing' event
            }).catch((error) => {
              console.error("Error playing audio:", error);
              setHasError(true);
              setIsPlaying(false);
              setActuallyPlaying(false);
              setIsLoading(false);
              
              if (onError) {
                onError();
              }
            });
          }
        }, 100);
      }
    }
  }, [src, isPlaying, onError]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (hasError) {
      // Try to reload the audio if there was an error
      audio.load();
      setHasError(false);
      setIsLoading(true);
      
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch((error) => {
            console.error("Error playing audio after retry:", error);
            setHasError(true);
            setIsLoading(false);
            
            if (onError) {
              onError();
            }
          });
        }
      }, 500);
      return;
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      setActuallyPlaying(false);
    } else {
      setIsLoading(true);
      
      // Implement play with retry logic
      const attemptPlay = (retryCount = 2) => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
            // Don't set actuallyPlaying here - wait for the 'playing' event or timeupdate
          }).catch(error => {
            console.error("Error playing audio:", error);
            
            if (retryCount > 0) {
              console.log(`Retrying playback (${retryCount} attempts left)`);
              setTimeout(() => attemptPlay(retryCount - 1), 1000);
            } else {
              setIsLoading(false);
              setHasError(true);
              setIsPlaying(false);
              setActuallyPlaying(false);
              
              if (onError) {
                onError();
              }
            }
          });
        }
      };
      
      attemptPlay();
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleProgress = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <audio ref={audioRef} src={src} preload="metadata" />
        <button 
          className={cn(
            "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105",
            isLoading && "opacity-70",
            hasError && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={togglePlay}
          disabled={isLoading && !hasError}
          aria-label={hasError ? "Retry audio" : actuallyPlaying ? "Pause" : "Play"}
        >
          {isLoading && !hasError ? (
            <Loader2 size={14} className="animate-spin" />
          ) : hasError ? (
            <RefreshCw size={14} />
          ) : actuallyPlaying ? (
            <Pause size={16} />
          ) : (
            <Play size={16} />
          )}
        </button>
        <div className="w-full max-w-[100px]">
          <input
            type="range"
            id="compact-audio-progress"
            name="compactAudioProgress"
            className={cn(
              "audio-progress w-full",
              hasError && "opacity-50",
              isLoading && "opacity-75"
            )}
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleProgress}
            disabled={hasError || isLoading}
            aria-label="Audio progress"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col w-full px-2 py-1", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />
      
      <div className="flex items-center gap-3 mb-1.5">
        <button 
          className={cn(
            "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105",
            (isLoading && !hasError) && "opacity-70",
            hasError && "bg-destructive hover:bg-destructive/90"
          )}
          onClick={togglePlay}
          disabled={isLoading && !hasError}
          aria-label={hasError ? "Retry audio" : actuallyPlaying ? "Pause" : "Play"}
        >
          {isLoading && !hasError ? (
            <Loader2 size={18} className="animate-spin" />
          ) : hasError ? (
            <RefreshCw size={18} />
          ) : actuallyPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-0.5" />
          )}
        </button>
        
        <div className="text-xs font-medium text-muted-foreground w-14 text-right">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex-grow">
          <input
            type="range"
            id="full-audio-progress"
            name="fullAudioProgress"
            className={cn(
              "audio-progress w-full", 
              hasError && "opacity-50",
              isLoading && "opacity-75"
            )}
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleProgress}
            disabled={hasError || isLoading}
            aria-label="Audio progress"
          />
        </div>
        
        <div className="text-xs font-medium text-muted-foreground w-14">
          {formatTime(duration)}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button 
            onClick={toggleMute} 
            className="text-muted-foreground hover:text-foreground"
            disabled={isLoading}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <input
            type="range"
            id="full-audio-volume"
            name="fullAudioVolume"
            className="audio-progress w-16"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
            disabled={isLoading}
            aria-label="Volume control"
          />
        </div>
      </div>
    </div>
  );
}
