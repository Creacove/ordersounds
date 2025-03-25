
import React, { createContext, useContext, useState } from 'react';
import { Beat } from '@/types';

interface PlayerContextType {
  isPlaying: boolean;
  currentBeat: Beat | null;
  volume: number;
  progress: number;
  playBeat: (beat: Beat | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  togglePlayPause: () => void; // Add this function
}

const PlayerContext = createContext<PlayerContextType>({
  isPlaying: false,
  currentBeat: null,
  volume: 0.5,
  progress: 0,
  playBeat: () => {},
  setIsPlaying: () => {},
  setVolume: () => {},
  setProgress: () => {},
  togglePlayPause: () => {}, // Add default implementation
});

export const usePlayer = () => useContext(PlayerContext);

export const PlayerProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);

  const playBeat = (beat: Beat | null) => {
    if (beat === null) {
      setIsPlaying(false);
      return;
    }

    if (currentBeat && currentBeat.id === beat.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentBeat(beat);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  // Add the togglePlayPause function
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <PlayerContext.Provider value={{ 
      isPlaying,
      currentBeat,
      volume,
      progress,
      playBeat,
      setIsPlaying,
      setVolume,
      setProgress,
      togglePlayPause // Expose the new function
    }}>
      {children}
    </PlayerContext.Provider>
  );
};
