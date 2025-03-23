
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Beat } from '@/types';

interface PlayerContextType {
  currentBeat: Beat | null;
  queue: Beat[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playBeat: (beat: Beat) => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (beat: Beat) => void;
  clearQueue: () => void;
  removeFromQueue: (beatId: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
      audio.addEventListener('timeupdate', () => setCurrentTime(audio.currentTime));
      audio.addEventListener('ended', handleTrackEnd);
      audio.volume = volume;
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('loadedmetadata', () => {});
        audioRef.current.removeEventListener('timeupdate', () => {});
        audioRef.current.removeEventListener('ended', () => {});
      }
    };
  }, []);

  useEffect(() => {
    // Update audio source when currentBeat changes
    if (currentBeat && audioRef.current) {
      audioRef.current.src = currentBeat.preview_url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentBeat]);

  const handleTrackEnd = () => {
    setIsPlaying(false);
    if (queue.length > 0) {
      // Auto play next track in queue
      nextTrack();
    }
  };

  const playBeat = (beat: Beat) => {
    // If already playing this beat, just toggle play state
    if (currentBeat && currentBeat.id === beat.id) {
      togglePlay();
      return;
    }
    
    setCurrentBeat(beat);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentBeat) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const setVolume = (newVolume: number) => {
    if (!audioRef.current) return;
    audioRef.current.volume = newVolume;
    setVolumeState(newVolume);
  };

  const nextTrack = () => {
    if (queue.length === 0) return;
    
    const nextBeat = queue[0];
    const newQueue = queue.slice(1);
    
    setCurrentBeat(nextBeat);
    setQueue(newQueue);
    setIsPlaying(true);
  };

  const previousTrack = () => {
    // For simplicity, just restart the current track
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const addToQueue = (beat: Beat) => {
    // Don't add duplicates
    if (queue.some(item => item.id === beat.id) || (currentBeat && currentBeat.id === beat.id)) {
      return;
    }
    
    setQueue([...queue, beat]);
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const removeFromQueue = (beatId: string) => {
    setQueue(queue.filter(beat => beat.id !== beatId));
  };

  return (
    <PlayerContext.Provider
      value={{
        currentBeat,
        queue,
        isPlaying,
        currentTime,
        duration,
        volume,
        playBeat,
        togglePlay,
        seek,
        setVolume,
        nextTrack,
        previousTrack,
        addToQueue,
        clearQueue,
        removeFromQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
