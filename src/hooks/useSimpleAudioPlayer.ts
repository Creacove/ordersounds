
import { useState, useCallback, useRef, useEffect } from 'react';
import { Beat } from '@/types';

export function useSimpleAudioPlayer() {
  const [currentBeat, setCurrentBeat] = useState<Beat | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playBeat = useCallback(async (beat: Beat | null) => {
    if (!beat) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentBeat(null);
      setIsPlaying(false);
      return;
    }

    // If same beat, toggle play/pause
    if (currentBeat?.id === beat.id) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          setIsLoading(true);
          try {
            await audioRef.current.play();
            setIsPlaying(true);
          } catch (error) {
            console.error('Error playing audio:', error);
          } finally {
            setIsLoading(false);
          }
        }
      }
      return;
    }

    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Start new beat
    setCurrentBeat(beat);
    setIsLoading(true);
    
    if (beat.preview_url) {
      audioRef.current = new Audio(beat.preview_url);
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentBeat(null);
      });
      
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setCurrentBeat(null);
      } finally {
        setIsLoading(false);
      }
    }
  }, [currentBeat, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return {
    currentBeat,
    isPlaying,
    isLoading,
    playBeat,
  };
}
