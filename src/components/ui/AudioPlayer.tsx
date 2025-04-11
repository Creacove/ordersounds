
import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  src: string;
  className?: string;
  compact?: boolean;
}

export function AudioPlayer({ src, className, compact = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };
    
    const handleError = (e: ErrorEvent) => {
      console.error("Audio playback error:", e);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
      // Don't show toast, just set error state
    };
    
    const handleLoadStart = () => {
      setIsLoading(true);
      setHasError(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    // Events
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError as EventListener);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError as EventListener);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Update source when src prop changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    if (audio.src !== src) {
      const wasPlaying = isPlaying;
      audio.pause();
      setIsPlaying(false);
      setHasError(false);
      
      audio.src = src;
      audio.load();
      
      if (wasPlaying) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setIsPlaying(true);
          }).catch((error) => {
            console.error("Error playing audio:", error);
            setHasError(true);
            // Don't show toast notification
          });
        }
      }
    }
  }, [src, isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (hasError) {
      // Try to reload the audio if there was an error
      audio.load();
      setHasError(false);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        }).catch(error => {
          console.error("Error playing audio:", error);
          setIsLoading(false);
          setHasError(true);
          // Don't show toast error
        });
      }
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
            isLoading && "opacity-70"
          )}
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <div className="w-full max-w-[100px]">
          <input
            type="range"
            className="audio-progress w-full"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleProgress}
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
            (isLoading || hasError) && "opacity-70"
          )}
          onClick={togglePlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        
        <div className="text-xs font-medium text-muted-foreground w-14 text-right">
          {formatTime(currentTime)}
        </div>
        
        <div className="flex-grow">
          <input
            type="range"
            className="audio-progress w-full"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleProgress}
          />
        </div>
        
        <div className="text-xs font-medium text-muted-foreground w-14">
          {formatTime(duration)}
        </div>

        <div className="flex items-center gap-1 ml-2">
          <button onClick={toggleMute} className="text-muted-foreground hover:text-foreground">
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          
          <input
            type="range"
            className="audio-progress w-16"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={handleVolume}
          />
        </div>
      </div>
    </div>
  );
}
