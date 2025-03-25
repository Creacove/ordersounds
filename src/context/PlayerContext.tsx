import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
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
  playBeat: (beat: Beat | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  addToQueue: (beat: Beat) => void;
  removeFromQueue: (beatId: string) => void;
  clearQueue: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType>({
  isPlaying: false,
  currentBeat: null,
  volume: 0.5,
  progress: 0,
  currentTime: 0,
  duration: 0,
  queue: [],
  playBeat: () => {},
  setIsPlaying: () => {},
  setVolume: () => {},
  setProgress: () => {},
  togglePlayPause: () => {},
  seek: () => {},
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  nextTrack: () => {},
  previousTrack: () => {},
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [previousBeats, setPreviousBeats] = useState<Beat[]>([]);
  
  const audioUrl = currentBeat?.preview_url || '';
  const { 
    playing, 
    currentTime, 
    duration, 
    togglePlay, 
    seek 
  } = useAudio(audioUrl);
  
  useEffect(() => {
    setIsPlaying(playing);
  }, [playing]);
  
  useEffect(() => {
    const audioElement = document.querySelector('audio');
    if (audioElement) {
      audioElement.volume = volume;
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
    if (progress >= 100 && queue.length > 0) {
      nextTrack();
    }
  }, [progress]);
  
  const playBeat = (beat: Beat | null) => {
    if (beat === null) {
      setIsPlaying(false);
      return;
    }

    if (currentBeat && currentBeat.id === beat.id) {
      togglePlayPause();
    } else {
      if (currentBeat) {
        setPreviousBeats(prev => [...prev, currentBeat]);
      }
      setCurrentBeat(beat);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  const togglePlayPause = () => {
    if (currentBeat) {
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
      setIsPlaying(true);
      setProgress(0);
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
      setIsPlaying(true);
      setProgress(0);
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
      playBeat,
      setIsPlaying,
      setVolume,
      setProgress,
      togglePlayPause,
      seek,
      addToQueue,
      removeFromQueue,
      clearQueue,
      nextTrack,
      previousTrack
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
