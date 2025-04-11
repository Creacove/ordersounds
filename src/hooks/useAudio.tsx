
import { useState, useRef, useEffect } from 'react';

interface UseAudioReturn {
  playing: boolean;
  duration: number;
  currentTime: number;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  error: boolean;
}

export const useAudio = (url: string): UseAudioReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [actuallyPlaying, setActuallyPlaying] = useState(false);

  // Initialize audio element and event listeners
  useEffect(() => {
    if (!url) {
      setError(true);
      return;
    }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Reset state for new audio source
    setIsReady(false);
    setPlaying(false);
    setActuallyPlaying(false);
    setError(false);
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration || 0);
      setIsReady(true);
      setError(false);
      console.log("Audio metadata loaded successfully", { url, duration: audioRef.current?.duration });
    };
    
    const handleCanPlay = () => {
      setIsReady(true);
      console.log("Audio can play now", { url });
    };
    
    const handleTimeUpdate = () => {
      // If we're getting time updates, audio is definitely playing
      setCurrentTime(audioRef.current?.currentTime || 0);
      if (!actuallyPlaying && audioRef.current?.currentTime > 0.5) {
        setActuallyPlaying(true);
      }
    };
    
    const handlePlaying = () => {
      console.log("Audio is now playing");
      setActuallyPlaying(true);
      setPlaying(true);
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
      console.error("Error playing audio:", audioRef.current?.error, e);
      setError(true);
      setPlaying(false);
      setActuallyPlaying(false);
    };
    
    // Set the source and attach event listeners
    console.log("Setting audio source:", url);
    audioRef.current.src = url;
    audioRef.current.load(); // Explicitly load the audio
    audioRef.current.volume = 0.7; // Set a default volume
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    audioRef.current.addEventListener('playing', handlePlaying);
    audioRef.current.addEventListener('pause', handlePause);
    
    // Set initial state in case audio is already loaded
    if (audioRef.current.readyState >= 2) {
      handleLoadedMetadata();
    }
    
    // Cleanup function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioRef.current.removeEventListener('canplay', handleCanPlay);
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleEnded);
        audioRef.current.removeEventListener('error', handleError);
        audioRef.current.removeEventListener('playing', handlePlaying);
        audioRef.current.removeEventListener('pause', handlePause);
      }
    };
  }, [url]);
  
  // Play/pause toggle function
  const togglePlay = () => {
    console.log("Toggle play called", { url, playing, isReady });
    if (!audioRef.current || !url) {
      console.error("No audio element or URL available");
      setError(true);
      return;
    }
    
    if (playing) {
      console.log("Pausing audio");
      audioRef.current.pause();
      setPlaying(false);
      setActuallyPlaying(false);
    } else {
      console.log("Attempting to play audio");
      setError(false); // Clear any previous errors
      
      const playAudio = async () => {
        if (!audioRef.current) return;
        
        try {
          console.log("Calling play() method");
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log("Audio playing successfully");
              setPlaying(true);
              // We won't set actuallyPlaying here - we'll wait for the 'playing' event
              // or for timeUpdate to confirm audio is actually playing
            }).catch(error => {
              console.error("Error playing audio:", error);
              setError(true);
              setPlaying(false);
              setActuallyPlaying(false);
            });
          }
        } catch (error) {
          console.error("Exception playing audio:", error);
          setError(true);
          setPlaying(false);
          setActuallyPlaying(false);
        }
      };
      
      // If audio is ready, play it immediately; otherwise wait for canplay event
      if (isReady) {
        playAudio();
      } else {
        console.log("Audio not ready, waiting for canplay event");
        // Add a temporary event listener for canplay that will be removed after first trigger
        const handleCanPlayToStart = () => {
          console.log("Can play event triggered for delayed playback");
          playAudio();
          audioRef.current?.removeEventListener('canplay', handleCanPlayToStart);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlayToStart);
        
        // Also try to load the audio again
        audioRef.current.load();
      }
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

  // Seek function to set current playback position
  const seek = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  // Add debugging information for development
  useEffect(() => {
    console.log("Audio state:", {
      url,
      playing,
      actuallyPlaying,
      duration,
      currentTime,
      error,
      isReady,
      readyState: audioRef.current?.readyState
    });
  }, [url, playing, actuallyPlaying, duration, currentTime, error, isReady]);

  return {
    playing: actuallyPlaying, // Return actuallyPlaying instead of playing
    duration,
    currentTime,
    togglePlay,
    stop,
    seek,
    error
  };
};
