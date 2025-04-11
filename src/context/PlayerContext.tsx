
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  togglePlay: () => void;
  pausePlayback: () => void;
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
  togglePlay: () => {},
  pausePlayback: () => {},
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
    seek,
    stop
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
      togglePlay(); // Ensure audio is paused when beat is null
      setCurrentBeat(null);
      return;
    }

    // If we're switching to a different beat
    if (!currentBeat || currentBeat.id !== beat.id) {
      // If something is currently playing, stop it first
      if (isPlaying) {
        stop(); // Stop the current audio immediately
      }
      
      // Save current beat to history if it exists
      if (currentBeat) {
        setPreviousBeats(prev => [...prev, currentBeat]);
      }
      
      // Update to the new beat
      setCurrentBeat(beat);
      
      // Force it to play immediately
      setTimeout(() => {
        togglePlay();
      }, 50);
    } else {
      // Same beat, just toggle play/pause
      togglePlayPause();
    }
  };

  const togglePlayPause = () => {
    if (currentBeat) {
      togglePlay();
    }
  };
  
  const pausePlayback = () => {
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
      togglePlay,
      pausePlayback,
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
