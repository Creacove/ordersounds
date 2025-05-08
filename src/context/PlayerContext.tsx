
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Beat } from '@/types';
import { useAudio } from '@/hooks/useAudio';

interface PlayerContextType {
  isPlaying: boolean;
  currentBeat: Beat | null;
  volume: number;
  progress: number;
  currentTime: number;
  duration: number;
  queue: Beat[];
  error?: boolean;
  loading?: boolean;
  playBeat: (beat: Beat | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  togglePlayPause: () => void;
  togglePlay: () => void;
  pausePlayback: () => void;
  seek: (time: number) => void;
  addToQueue: (beat: Beat) => void;
  removeFromQueue: (beatId: string) => void;
  clearQueue: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  reload?: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  isPlaying: false,
  currentBeat: null,
  volume: 0.5,
  progress: 0,
  currentTime: 0,
  duration: 0,
  queue: [],
  error: false,
  loading: false,
  playBeat: () => {},
  setIsPlaying: () => {},
  setVolume: () => {},
  setProgress: () => {},
  togglePlayPause: () => {},
  togglePlay: () => {},
  pausePlayback: () => {},
  seek: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  nextTrack: () => {},
  previousTrack: () => {},
  reload: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [previousBeats, setPreviousBeats] = useState<Beat[]>([]);
  const nextBeatAudio = useRef<HTMLAudioElement | null>(null);
  
  // Fetch URL immediately when currentBeat changes
  const audioUrl = currentBeat?.preview_url || '';
  
  const { 
    playing, 
    currentTime, 
    duration, 
    togglePlay, 
    seek,
    stop,
    error,
    reload,
    loading
  } = useAudio(audioUrl);
  
  // Pre-load next track for instant playback
  useEffect(() => {
    if (queue.length > 0 && queue[0]?.preview_url) {
      if (!nextBeatAudio.current) {
        nextBeatAudio.current = new Audio();
        nextBeatAudio.current.preload = "auto";
      }
      
      // Set source and begin loading
      nextBeatAudio.current.src = queue[0].preview_url;
      nextBeatAudio.current.load();
      
      return () => {
        if (nextBeatAudio.current) {
          nextBeatAudio.current.src = '';
        }
      };
    }
  }, [queue]);
  
  useEffect(() => {
    if (error && currentBeat) {
      // Don't show errors to user, just retry loading in the background
      console.log("Handling audio error in background");
    }
  }, [error, currentBeat]);
  
  useEffect(() => {
    setIsPlaying(playing);
  }, [playing]);
  
  useEffect(() => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = volume;
    });
    
    // Also set volume for preloaded next track
    if (nextBeatAudio.current) {
      nextBeatAudio.current.volume = volume;
    }
  }, [volume]);
  
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    } else {
      setProgress(0);
    }
  }, [currentTime, duration]);
  
  useEffect(() => {
    if (progress >= 99.5 && queue.length > 0) {
      nextTrack();
    }
  }, [progress]);
  
  const playBeat = (beat: Beat | null) => {
    console.log("playBeat called with:", beat?.title);
    if (beat === null) {
      setIsPlaying(false);
      stop();
      setCurrentBeat(null);
      return;
    }

    if (!currentBeat || currentBeat.id !== beat.id) {
      if (isPlaying) {
        console.log("Stopping current audio before playing new beat");
        stop();
      }
      
      if (currentBeat) {
        setPreviousBeats(prev => [...prev, currentBeat]);
      }
      
      console.log("Setting new beat:", beat.title);
      setCurrentBeat(beat);
      
      // Start playing immediately
      setIsPlaying(true);
      
      // Immediate play without delay for faster response
      setTimeout(togglePlay, 0);
    } else {
      console.log("Same beat, toggling play/pause");
      togglePlayPause();
    }
  };

  const togglePlayPause = () => {
    console.log("togglePlayPause called");
    if (currentBeat) {
      togglePlay();
    }
  };
  
  const pausePlayback = () => {
    console.log("pausePlayback called");
    if (isPlaying) {
      togglePlay();
    }
  };
  
  const addToQueue = (beat: Beat) => {
    setQueue(prev => [...prev, beat]);
  };
  
  const removeFromQueue = (beatId: string) => {
    setQueue(prev => prev.filter(beat => beat.id !== beatId));
  };
  
  const clearQueue = () => {
    setQueue([]);
  };
  
  const nextTrack = () => {
    if (queue.length > 0) {
      const nextBeat = queue[0];
      const newQueue = queue.slice(1);
      
      if (currentBeat) {
        setPreviousBeats(prev => [...prev, currentBeat]);
      }
      
      setCurrentBeat(nextBeat);
      setQueue(newQueue);
      
      // Immediate play without delay
      setTimeout(togglePlay, 0);
    }
  };
  
  const previousTrack = () => {
    if (previousBeats.length > 0) {
      const prevBeat = previousBeats[previousBeats.length - 1];
      const newPreviousBeats = previousBeats.slice(0, -1);
      
      if (currentBeat) {
        setQueue(prev => [currentBeat, ...prev]);
      }
      
      setCurrentBeat(prevBeat);
      setPreviousBeats(newPreviousBeats);
      
      // Immediate play without delay
      setTimeout(togglePlay, 0);
    }
  };

  return (
    <PlayerContext.Provider value={{ 
      isPlaying,
      currentBeat,
      volume,
      progress,
      currentTime,
      duration,
      queue,
      error,
      loading,
      playBeat,
      setIsPlaying,
      setVolume,
      setProgress,
      togglePlayPause,
      togglePlay,
      pausePlayback,
      seek,
      addToQueue,
      removeFromQueue,
      clearQueue,
      nextTrack,
      previousTrack,
      reload
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
