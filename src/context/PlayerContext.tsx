
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Beat } from '@/types';
import { useAudio } from '@/hooks/useAudio';
// Remove toast import as we're not going to show errors anymore

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
  const [volume, setVolume] = useState(0.7); // Higher default volume for better audibility
  const [progress, setProgress] = useState(0);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [previousBeats, setPreviousBeats] = useState<Beat[]>([]);
  
  const audioUrl = currentBeat?.preview_url || '';
  console.log("Current audio URL:", audioUrl);
  
  const { 
    playing, 
    currentTime, 
    duration, 
    togglePlay, 
    seek,
    stop,
    error
  } = useAudio(audioUrl);
  
  // Handle audio errors silently
  useEffect(() => {
    if (error && currentBeat) {
      // Just log the error, don't show toast
      console.error("Audio playback error for beat:", currentBeat?.title);
    }
  }, [error, currentBeat]);
  
  useEffect(() => {
    setIsPlaying(playing);
  }, [playing]);
  
  // Set volume for audio element
  useEffect(() => {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = volume;
    });
    console.log("Set volume to:", volume);
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
    console.log("playBeat called with:", beat?.title);
    if (beat === null) {
      setIsPlaying(false);
      stop(); // Use stop instead of togglePlay to ensure complete reset
      setCurrentBeat(null);
      return;
    }

    // If we're switching to a different beat
    if (!currentBeat || currentBeat.id !== beat.id) {
      // If something is currently playing, stop it first
      if (isPlaying) {
        console.log("Stopping current audio before playing new beat");
        stop(); // Stop the current audio immediately
      }
      
      // Save current beat to history if it exists
      if (currentBeat) {
        setPreviousBeats(prev => [...prev, currentBeat]);
      }
      
      // Update to the new beat
      console.log("Setting new beat:", beat.title);
      setCurrentBeat(beat);
      
      // Force it to play immediately without waiting for state updates
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        togglePlay();
        setIsPlaying(true);
      });
    } else {
      // Same beat, just toggle play/pause
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
      setIsPlaying(true);
      setProgress(0);
      
      // Force playback of the next track
      requestAnimationFrame(() => togglePlay());
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
      
      // Force playback of the previous track
      requestAnimationFrame(() => togglePlay());
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
