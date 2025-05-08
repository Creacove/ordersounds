
import { useState, useRef, useEffect } from 'react';

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

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "metadata"; // More efficient initial loading
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Handle URL changes and set up event listeners
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
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsReady(true);
      setError(false);
      setLoading(false);
      console.log("Audio metadata loaded successfully", { url, duration: audio.duration });
    };
    
    const handleCanPlay = () => {
      setIsReady(true);
      setError(false);
      setLoading(false);
      console.log("Audio can play now", { url });
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
      if (!actuallyPlaying && audio.currentTime > 0.5) {
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
    
    const handleError = (e: any) => {
      console.error("Error playing audio:", audio?.error, e);
      setError(true);
      setPlaying(false);
      setActuallyPlaying(false);
      setLoading(false);
    };
    
    const handleWaiting = () => {
      setLoading(true);
    };
    
    const handleStalled = () => {
      // Only set error if we've been stalled for a while
      setTimeout(() => {
        if (audio.readyState < 3 && !audio.paused) {
          setError(true);
          setLoading(false);
        }
      }, 5000);
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
    
    // Set source and load
    console.log("Setting audio source:", url);
    audio.src = url;
    audio.load();
    audio.volume = 0.7; // Set default volume
    
    // If already loaded, trigger the loaded event
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
  }, [url, actuallyPlaying]);
  
  // Toggle play/pause
  const togglePlay = () => {
    console.log("Toggle play called", { url, playing, isReady });
    if (!audioRef.current || !url) {
      console.error("No audio element or URL available");
      setError(true);
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
      setError(false); // Clear any previous errors
      setLoading(true);
      
      // Using a more robust play method with retry
      const attemptPlay = async (retries = 2) => {
        try {
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log("Audio playing successfully");
            setPlaying(true);
            setLoading(false);
            // actuallyPlaying will be set by the 'playing' event
          }
        } catch (error) {
          console.error("Error playing audio:", error);
          
          // Auto-retry with exponential backoff
          if (retries > 0) {
            console.log(`Retrying playback (${retries} attempts left)...`);
            setTimeout(() => attemptPlay(retries - 1), 1000);
          } else {
            setError(true);
            setPlaying(false);
            setActuallyPlaying(false);
            setLoading(false);
          }
        }
      };
      
      attemptPlay();
    }
  };

  // Stop function (pause and reset time)
  const stop = () => {
    console.log("Stop audio called");
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setActuallyPlaying(false);
    setCurrentTime(0);
  };

  // Seek function
  const seek = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  // Reload function for handling errors
  const reload = () => {
    if (!audioRef.current || !url) return;
    
    console.log("Reloading audio");
    setError(false);
    setLoading(true);
    
    const audio = audioRef.current;
    audio.pause();
    audio.currentTime = 0;
    audio.load();
    
    // Try playing after a short delay
    setTimeout(() => {
      if (audioRef.current) {
        togglePlay();
      }
    }, 500);
  };

  // For debugging
  useEffect(() => {
    console.log("Audio state:", {
      url,
      playing,
      actuallyPlaying,
      duration,
      currentTime,
      error,
      isReady,
      loading,
      readyState: audioRef.current?.readyState
    });
  }, [url, playing, actuallyPlaying, duration, currentTime, error, isReady, loading]);

  return {
    playing: actuallyPlaying, // Return actuallyPlaying instead of playing
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
