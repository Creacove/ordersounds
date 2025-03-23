import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Beat } from '@/types';
import { toast } from 'sonner';

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
    if (currentBeat && audioRef.current) {
      audioRef.current.src = currentBeat.preview_url;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(error => {
          console.error('Failed to play audio:', error);
          setIsPlaying(false);
          toast.error('Failed to play audio. Try again.');
        });
      }
    }
  }, [currentBeat]);

  const handleTrackEnd = () => {
    setIsPlaying(false);
    if (queue.length > 0) {
      nextTrack();
    } else {
      setCurrentTime(0);
    }
  };

  const playBeat = (beat: Beat) => {
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
      audioRef.current.play().catch(error => {
        console.error('Failed to play audio:', error);
        toast.error('Failed to play audio. Try again.');
      });
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
    if (audioRef.current) {
      if (currentTime > 3) {
        // If more than 3 seconds in, just restart the current track
        audioRef.current.currentTime = 0;
      } else if (currentBeat) {
        // Otherwise restart and maintain play state
        audioRef.current.currentTime = 0;
        // Could implement history in the future
      }
    }
  };

  const addToQueue = (beat: Beat) => {
    if (queue.some(item => item.id === beat.id) || (currentBeat && currentBeat.id === beat.id)) {
      toast.info(`"${beat.title}" is already in your queue`);
      return;
    }
    
    setQueue([...queue, beat]);
  };

  const clearQueue = () => {
    setQueue([]);
    toast.success('Queue cleared');
  };

  const removeFromQueue = (beatId: string) => {
    setQueue(queue.filter(beat => beat.id !== beatId));
    toast.success('Removed from queue');
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
