
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
    setError(false);
    
    // Set up event listeners
    const handleLoadedMetadata = () => {
      setDuration(audioRef.current?.duration || 0);
      setIsReady(true);
      setError(false);
    };
    
    const handleCanPlay = () => {
      setIsReady(true);
    };
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    };
    
    const handleEnded = () => {
      setPlaying(false);
    };
    
    const handleError = () => {
      console.error("Error playing audio:", audioRef.current?.error);
      setError(true);
      setPlaying(false);
    };
    
    // Set the source and attach event listeners
    audioRef.current.src = url;
    audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
    audioRef.current.addEventListener('canplay', handleCanPlay);
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
    audioRef.current.addEventListener('ended', handleEnded);
    audioRef.current.addEventListener('error', handleError);
    
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
      }
    };
  }, [url]);
  
  // Play/pause toggle function
  const togglePlay = () => {
    if (!audioRef.current || !url) return;
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      setError(false); // Clear any previous errors
      
      const playAudio = () => {
        if (!audioRef.current) return;
        
        try {
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setPlaying(true);
            }).catch(error => {
              console.error("Error playing audio:", error);
              setError(true);
              setPlaying(false);
            });
          }
        } catch (error) {
          console.error("Error playing audio:", error);
          setError(true);
          setPlaying(false);
        }
      };
      
      // If audio is ready, play it immediately; otherwise wait for canplay event
      if (isReady) {
        playAudio();
      } else {
        // Add a temporary event listener for canplay that will be removed after first trigger
        const handleCanPlayToStart = () => {
          playAudio();
          audioRef.current?.removeEventListener('canplay', handleCanPlayToStart);
        };
        
        audioRef.current.addEventListener('canplay', handleCanPlayToStart);
      }
    }
  };

  // Stop function (pause and reset time)
  const stop = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
  };

  // Seek function to set current playback position
  const seek = (time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return {
    playing,
    duration,
    currentTime,
    togglePlay,
    stop,
    seek,
    error
  };
};
