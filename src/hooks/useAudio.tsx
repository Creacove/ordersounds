
import { useState, useEffect, useRef } from "react";

type AudioState = {
  url: string;
  playing: boolean;
  actuallyPlaying: boolean;
  duration: number;
  currentTime: number;
  error: boolean;
  isReady: boolean;
  readyState: { _type: string; value: string };
};

export function useAudio(url: string) {
  const [playing, setPlaying] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [readyState, setReadyState] = useState<{ _type: string; value: string }>({
    _type: "undefined",
    value: "undefined",
  });
  
  const [retryAttempt, setRetryAttempt] = useState(0);
  const maxRetryAttempts = 3;

  // We're using a ref to keep track of the audio element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // For debugging
  useEffect(() => {
    console.info("Audio state:", {
      url,
      playing,
      actuallyPlaying,
      duration,
      currentTime,
      error,
      isReady,
      readyState,
    });
  }, [url, playing, actuallyPlaying, duration, currentTime, error, isReady, readyState]);

  // This effect runs when the URL changes
  useEffect(() => {
    // Clean up the old audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current.load();
      audioRef.current = null;
    }

    setDuration(0);
    setCurrentTime(0);
    setPlaying(false);
    setActuallyPlaying(false);
    setError(false);
    setIsReady(false);
    setRetryAttempt(0);

    if (!url) return;

    const audio = new Audio();
    console.log("Creating new audio element for:", url);
    
    // The crossOrigin attribute must be set for processing audio from other domains
    audio.crossOrigin = "anonymous";
    audio.preload = "auto"; // Force preloading for better experience
    
    // Add cache-busting to URL if not already present
    const cacheBustUrl = url.includes('?') ? url : `${url}?cb=${Date.now()}`;
    
    // Set error handling first to catch any loading errors
    audio.onerror = (e) => {
      console.error("Audio error occurred");
      setError(true);
      setIsReady(false);
      setPlaying(false);
      setActuallyPlaying(false);
      
      // Auto retry with backoff
      if (retryAttempt < maxRetryAttempts) {
        const nextAttempt = retryAttempt + 1;
        console.info(`Retry attempt ${nextAttempt} of ${maxRetryAttempts}`);
        setRetryAttempt(nextAttempt);
        
        setTimeout(() => {
          if (audioRef.current) {
            // Add cache busting to URL
            const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}-${nextAttempt}`;
            audioRef.current.src = cacheBustUrl;
            audioRef.current.load();
          }
        }, 1000 * nextAttempt); // Exponential backoff
      }
    };

    // If the audio loads successfully, update state
    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
      setReadyState({
        _type: "number",
        value: audio.readyState.toString(),
      });
      setIsReady(true);
      setError(false); // Clear any previous error
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
      
      // If we're getting time updates and current time is advancing, audio is definitely playing
      if (!actuallyPlaying && audio.currentTime > 0) {
        setActuallyPlaying(true);
      }
    };
    
    audio.onplay = () => {
      setPlaying(true);
    };
    
    audio.onplaying = () => {
      setActuallyPlaying(true);
      setError(false); // Clear any previous error
    };
    
    audio.onpause = () => {
      setPlaying(false);
      setActuallyPlaying(false);
    };
    
    audio.onended = () => {
      setPlaying(false);
      setActuallyPlaying(false);
      setCurrentTime(0);
    };
    
    audio.oncanplay = () => {
      setIsReady(true);
      setError(false); // Clear any previous error
    };
    
    audio.onwaiting = () => {
      setActuallyPlaying(false);
    };

    // Set the URL and load the audio
    audio.src = cacheBustUrl;
    audio.load();
    
    // Store the audio element in the ref
    audioRef.current = audio;

    // Clean up when component unmounts or URL changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current.load();
        audioRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [url, retryAttempt]);
  
  // Function to toggle play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (error) {
      // If there's an error, try to reload first
      setError(false);
      setRetryAttempt(0);
      audioRef.current.load();
      return;
    }

    if (playing) {
      audioRef.current.pause();
    } else {
      const playPromise = audioRef.current.play();
      
      // Modern browsers return a promise from play()
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setPlaying(true);
        }).catch((e) => {
          console.error("Play failed:", e);
          setError(true);
          setPlaying(false);
          setActuallyPlaying(false);
        });
      }
    }
  };
  
  // Function to stop playback completely (pause + reset position)
  const stop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setActuallyPlaying(false);
    setCurrentTime(0);
  };
  
  // Function to seek to a specific time
  const seek = (time: number) => {
    if (!audioRef.current || error) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };
  
  // Reload audio function for external retry
  const reload = () => {
    if (!audioRef.current || !url) return;
    
    setError(false);
    setRetryAttempt(0);
    
    // Add cache busting to URL
    const cacheBustUrl = `${url}${url.includes('?') ? '&' : '?'}cb=${Date.now()}-reload`;
    audioRef.current.src = cacheBustUrl;
    audioRef.current.load();
    
    // Try to play after a small delay
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch((e) => {
          console.error("Reload play failed:", e);
          setError(true);
        });
      }
    }, 500);
  };

  return {
    playing,
    currentTime,
    duration,
    togglePlay,
    seek,
    stop,
    error,
    isReady,
    reload,
    actuallyPlaying
  };
}
