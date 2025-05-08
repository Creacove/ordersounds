
import { useState, useRef, useEffect, useCallback } from 'react';

interface UseAudioReturn {
  playing: boolean;
  duration: number;
  currentTime: number;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  error: boolean;
  isReady: boolean;
  actuallyPlaying: boolean;
  reload: () => void;
  url: string;
  loading: boolean;
}

export const useAudio = (url: string): UseAudioReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const previousUrl = useRef<string | null>(null);
  
  // Initialize audio element with higher priority
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    
    // Set global settings to prioritize playback
    if (audioRef.current) {
      audioRef.current.volume = 0.7;
      
      // This may help with faster loading in some browsers
      if ('priority' in audioRef.current) {
        (audioRef.current as any).priority = 'high';
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle URL changes and set up event listeners with optimizations
  useEffect(() => {
    if (!url || url === previousUrl.current) return;
    
    const audio = audioRef.current;
    if (!audio) return;
    
    // Reset state when URL changes
    setIsReady(false);
    setPlaying(false);
    setActuallyPlaying(false);
    setError(false);
    setLoading(true);
    setDuration(0);
    setCurrentTime(0);
    
    // Store current URL to compare against future changes
    previousUrl.current = url;
    
    // Set up event listeners with optimized handlers
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsReady(true);
      setError(false);
      setLoading(false);
      console.log("Audio metadata loaded successfully", { url, duration: audio.duration });
      
      // Auto-play as soon as metadata is loaded for near-instant playback
      if (playing) {
        audio.play().catch(() => {
          // Silently catch and retry once
          setTimeout(() => audio.play().catch(() => {}), 100);
        });
      }
    };
    
    const handleCanPlay = () => {
      setIsReady(true);
      setError(false);
      setLoading(false);
      console.log("Audio can play now", { url });
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if (!actuallyPlaying && audio.currentTime > 0.1) {
        setActuallyPlaying(true);
      }
    };
    
    const handlePlaying = () => {
      console.log("Audio is now playing");
      setActuallyPlaying(true);
      setPlaying(true);
      setLoading(false);
    };
    
    const handlePause = () => {
      console.log("Audio paused");
      setActuallyPlaying(false);
      setPlaying(false);
    };
    
    const handleEnded = () => {
      setPlaying(false);
      setActuallyPlaying(false);
    };
    
    const handleError = () => {
      console.error("Error playing audio:", audio?.error);
      setLoading(false);
      
      // Don't show error state to user - just retry automatically
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          
          // Try playing again after a short delay
          setTimeout(() => {
            if (audioRef.current && playing) {
              audioRef.current.play().catch(() => {});
            }
          }, 200);
        }
      }, 200);
    };
    
    const handleWaiting = () => {
      setLoading(true);
    };
    
    const handleStalled = () => {
      setTimeout(() => {
        if (audio.readyState < 3 && !audio.paused) {
          setLoading(true);
        }
      }, 1000); // Reduced timeout
    };

    // Attach event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    
    // Set source and load immediately
    console.log("Setting audio source:", url);
    audio.src = url;
    audio.load();
    audio.volume = 0.7;
    
    // If already loaded, trigger the loaded event immediately
    if (audio.readyState >= 2) {
      handleLoadedMetadata();
    }
    
    // Cleanup
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [url, playing]);
  
  // Toggle play/pause with optimized handling
  const togglePlay = useCallback(() => {
    console.log("Toggle play called", { url, playing, isReady });
    if (!audioRef.current || !url) {
      console.log("No valid audio source");
      // Don't show error to user, just set loading state
      setLoading(true);
      return;
    }
    
    const audio = audioRef.current;
    
    if (playing) {
      console.log("Pausing audio");
      audio.pause();
      setPlaying(false);
      setActuallyPlaying(false);
    } else {
      console.log("Attempting to play audio");
      setLoading(true);
      
      // Immediate attempt to play with auto-retry
      const attemptPlay = async (retries = 3) => {
        try {
          // Force load if not ready
          if (audio.readyState < 2) {
            audio.load();
          }
          
          await audio.play();
          console.log("Audio playing successfully");
          setPlaying(true);
          setLoading(false);
        } catch (error) {
          console.error("Error playing audio:", error);
          
          if (retries > 0) {
            console.log(`Retrying playback (${retries} attempts left)...`);
            setTimeout(() => attemptPlay(retries - 1), 150); // Faster retry
          } else {
            setLoading(false);
          }
        }
      };
      
      attemptPlay();
    }
  }, [url, playing]);

  // Stop function (pause and reset time)
  const stop = useCallback(() => {
    console.log("Stop audio called");
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setActuallyPlaying(false);
    setCurrentTime(0);
  }, []);

  // Seek function
  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);
  
  // Reload function - faster with less delay
  const reload = useCallback(() => {
    if (!audioRef.current || !url) return;
    
    console.log("Reloading audio");
    setError(false);
    setLoading(true);
    
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.load();
    
    // Try playing immediately
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setPlaying(true);
          })
          .catch(() => {
            // Silent catch, will retry in background
          });
      }
    }, 100);
  }, [url]);

  return {
    playing,
    actuallyPlaying,
    duration,
    currentTime,
    togglePlay,
    stop,
    seek,
    error,
    isReady,
    reload,
    url,
    loading
  };
};
