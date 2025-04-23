
import { useState, useEffect, useRef } from 'react';

interface AudioState {
  url: string;
  playing: boolean;
  actuallyPlaying: boolean;
  duration: number;
  currentTime: number;
  error: boolean;
  isReady: boolean;
  readyState: number | undefined;
}

export const useAudio = (url: string) => {
  const [state, setState] = useState<AudioState>({
    url,
    playing: false,
    actuallyPlaying: false,
    duration: 0,
    currentTime: 0,
    error: false,
    isReady: false,
    readyState: undefined
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  
  // For debugging
  useEffect(() => {
    console.log("Audio state:", {
      url, 
      playing: state.playing,
      actuallyPlaying: state.actuallyPlaying,
      duration: state.duration,
      currentTime: state.currentTime,
      error: state.error,
      isReady: state.isReady,
      readyState: state.readyState
    });
  }, [url, state]);

  // Set up audio element when URL changes
  useEffect(() => {
    const audio = new Audio(url);
    audioRef.current = audio;
    
    // Reset state when URL changes
    setState(prev => ({
      ...prev,
      url,
      playing: false,
      actuallyPlaying: false,
      duration: 0,
      currentTime: 0,
      error: false,
      isReady: false,
      readyState: undefined
    }));
    
    if (!url) {
      return () => {
        // Clean up
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }

    const setError = () => {
      setState(prev => ({ ...prev, error: true, playing: false }));
      console.error("Audio error occurred");
    };

    const setDuration = () => {
      const duration = audio.duration;
      setState(prev => ({ 
        ...prev, 
        duration,
        isReady: true,
        readyState: audio.readyState
      }));
      console.log(`Audio loaded, duration: ${duration}s, readyState: ${audio.readyState}`);
    };
    
    const onCanPlay = () => {
      setState(prev => ({ 
        ...prev, 
        isReady: true,
        readyState: audio.readyState,
        duration: audio.duration || prev.duration
      }));
      console.log(`Audio can play, duration: ${audio.duration}s, readyState: ${audio.readyState}`);
    };
    
    const onLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        isReady: true,
        readyState: audio.readyState,
        duration: audio.duration || prev.duration
      }));
      console.log(`Audio metadata loaded, duration: ${audio.duration}s, readyState: ${audio.readyState}`);
    };
    
    const onPlaying = () => {
      setState(prev => ({ ...prev, actuallyPlaying: true }));
    };
    
    const onPause = () => {
      setState(prev => ({ ...prev, actuallyPlaying: false }));
    };

    audio.addEventListener('error', setError);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('durationchange', setDuration);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('pause', onPause);

    // Initial load for duration if already loaded
    if (audio.readyState >= 2) {
      setDuration();
    }

    return () => {
      audio.removeEventListener('error', setError);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('durationchange', setDuration);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('pause', onPause);
      
      // Cleanup
      audio.pause();
      
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [url]);

  // Handle play state changes
  useEffect(() => {
    if (!audioRef.current) return;

    // Set up time update interval
    if (state.playing && !intervalRef.current) {
      intervalRef.current = window.setInterval(() => {
        if (audioRef.current) {
          setState(prev => ({
            ...prev,
            currentTime: audioRef.current?.currentTime || 0,
          }));
        }
      }, 100);
    } else if (!state.playing && intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Handle play/pause
    if (state.playing && audioRef.current.paused) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Audio play error:', error);
          setState(prev => ({ ...prev, playing: false, error: true }));
        });
      }
    } else if (!state.playing && !audioRef.current.paused) {
      audioRef.current.pause();
    }

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.playing]);

  // Toggle play/pause
  const togglePlay = () => {
    setState(prev => ({ ...prev, playing: !prev.playing }));
  };

  // Stop playback
  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setState(prev => ({ 
      ...prev, 
      playing: false,
      actuallyPlaying: false,
      currentTime: 0
    }));
  };

  // Set current time
  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  };

  return {
    playing: state.playing,
    actuallyPlaying: state.actuallyPlaying,
    togglePlay,
    seek,
    stop,
    duration: state.duration,
    currentTime: state.currentTime,
    error: state.error,
    isReady: state.isReady
  };
};
