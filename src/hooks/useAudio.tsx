
import { useState, useRef, useEffect } from 'react';

interface UseAudioReturn {
  playing: boolean;
  duration: number;
  currentTime: number;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
}

export const useAudio = (url: string): UseAudioReturn => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Initialize audio element and event listeners
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
      
      // Set up event listeners
      const handleLoadedMetadata = () => {
        setDuration(audioRef.current?.duration || 0);
      };
      
      const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      };
      
      const handleEnded = () => {
        setPlaying(false);
      };
      
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Cleanup function
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, []);
  
  // Update source if URL changes
  useEffect(() => {
    if (audioRef.current && url) {
      // If URL changed, pause first, then update source
      if (audioRef.current.src !== url) {
        const wasPlaying = playing;
        audioRef.current.pause();
        setPlaying(false);
        
        audioRef.current.src = url;
        audioRef.current.load();
        setCurrentTime(0);
        setDuration(0);
        
        // If it was playing before, start playing again after source change
        if (wasPlaying) {
          const playPromise = audioRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise.then(() => {
              setPlaying(true);
            }).catch(error => {
              console.error("Error playing audio:", error);
            });
          }
        }
      }
    }
  }, [url, playing]);

  // Play/pause toggle function
  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setPlaying(true);
        }).catch(error => {
          console.error("Error playing audio:", error);
        });
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
    seek
  };
};
