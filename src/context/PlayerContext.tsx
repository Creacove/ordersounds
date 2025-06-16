
import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Beat } from '@/types';
import { useAudioStreaming } from '@/hooks/useAudioStreaming';
import { AudioManager } from '@/lib/audioManager';

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
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [previousBeats, setPreviousBeats] = useState<Beat[]>([]);
  const audioManager = AudioManager.getInstance();
  
  // Use the optimized audio streaming hook
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
  } = useAudioStreaming(audioUrl);

  // Memoize progress calculation to prevent unnecessary re-renders
  const progress = useMemo(() => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  }, [currentTime, duration]);

  // Preload next track when queue changes
  useEffect(() => {
    if (queue.length > 0 && queue[0]?.preview_url) {
      audioManager.preloadAudio(queue[0].preview_url);
    }
  }, [queue, audioManager]);

  // Update volume across all audio instances
  useEffect(() => {
    audioManager.setVolume(volume);
  }, [volume, audioManager]);

  // Auto-play next track when current track ends
  useEffect(() => {
    if (progress >= 99.5 && queue.length > 0) {
      nextTrack();
    }
  }, [progress, queue.length]);

  const createMinimalBeat = useCallback((beat: Beat): Beat => ({
    id: beat.id,
    title: beat.title,
    producer_name: beat.producer_name,
    preview_url: beat.preview_url,
    cover_image_url: beat.cover_image_url,
  } as Beat), []);

  const playBeat = useCallback((beat: Beat | null) => {
    if (beat === null) {
      stop();
      setCurrentBeat(null);
      return;
    }

    const minimalBeat = createMinimalBeat(beat);

    if (!currentBeat || currentBeat.id !== beat.id) {
      if (currentBeat) {
        setPreviousBeats(prev => [currentBeat, ...prev.slice(0, 9)]); // Keep last 10
      }
      
      setCurrentBeat(minimalBeat);
      
      // Start playing after a minimal delay for better UX
      setTimeout(togglePlay, 50);
    } else {
      togglePlay();
    }
  }, [currentBeat, createMinimalBeat, stop, togglePlay]);

  const togglePlayPause = useCallback(() => {
    if (currentBeat) {
      togglePlay();
    }
  }, [currentBeat, togglePlay]);
  
  const pausePlayback = useCallback(() => {
    if (playing) {
      togglePlay();
    }
  }, [playing, togglePlay]);
  
  const addToQueue = useCallback((beat: Beat) => {
    const minimalBeat = createMinimalBeat(beat);
    setQueue(prev => [...prev, minimalBeat]);
  }, [createMinimalBeat]);
  
  const removeFromQueue = useCallback((beatId: string) => {
    setQueue(prev => prev.filter(beat => beat.id !== beatId));
  }, []);
  
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);
  
  const nextTrack = useCallback(() => {
    if (queue.length > 0) {
      const nextBeat = queue[0];
      
      if (currentBeat) {
        setPreviousBeats(prev => [currentBeat, ...prev.slice(0, 9)]);
      }
      
      setCurrentBeat(nextBeat);
      setQueue(prev => prev.slice(1));
      
      setTimeout(togglePlay, 50);
    }
  }, [queue, currentBeat, togglePlay]);
  
  const previousTrack = useCallback(() => {
    if (previousBeats.length > 0) {
      const prevBeat = previousBeats[0];
      
      if (currentBeat) {
        setQueue(prev => [currentBeat, ...prev]);
      }
      
      setCurrentBeat(prevBeat);
      setPreviousBeats(prev => prev.slice(1));
      
      setTimeout(togglePlay, 50);
    }
  }, [previousBeats, currentBeat, togglePlay]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isPlaying: playing,
    currentBeat,
    volume,
    progress,
    currentTime,
    duration,
    queue,
    error,
    loading,
    playBeat,
    setIsPlaying: () => {}, // Deprecated but kept for compatibility
    setVolume,
    setProgress: () => {}, // Deprecated but kept for compatibility
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
  }), [
    playing, currentBeat, volume, progress, currentTime, duration, queue, error, loading,
    playBeat, setVolume, togglePlayPause, togglePlay, pausePlayback, seek,
    addToQueue, removeFromQueue, clearQueue, nextTrack, previousTrack, reload
  ]);

  return (
    <PlayerContext.Provider value={contextValue}>
      {children}
    </PlayerContext.Provider>
  );
};
