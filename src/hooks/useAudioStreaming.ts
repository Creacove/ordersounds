
import { useState, useRef, useEffect, useCallback } from 'react';
import { AudioManager } from '@/lib/audioManager';

interface UseAudioStreamingReturn {
  playing: boolean;
  duration: number;
  currentTime: number;
  togglePlay: () => void;
  stop: () => void;
  seek: (time: number) => void;
  error: boolean;
  loading: boolean;
  reload: () => void;
}

export const useAudioStreaming = (url: string): UseAudioStreamingReturn => {
  const audioManager = AudioManager.getInstance();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const progressInterval = useRef<number | null>(null);
  const previousUrl = useRef<string>('');

  // Debounced progress updates for better performance
  const updateProgress = useCallback(() => {
    if (audioRef.current && playing) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [playing]);

  useEffect(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    if (playing && audioRef.current) {
      progressInterval.current = window.setInterval(updateProgress, 250);
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [playing, updateProgress]);

  useEffect(() => {
    if (!url || url === previousUrl.current) return;
    
    previousUrl.current = url;
    setError(false);
    setLoading(true);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Get audio from manager
    const audio = audioManager.getAudio(url);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setLoading(false);
      setError(false);
    };

    const handleCanPlay = () => {
      setLoading(false);
      setError(false);
    };

    const handlePlaying = () => {
      setPlaying(true);
      setLoading(false);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleError = () => {
      setError(true);
      setLoading(false);
      setPlaying(false);
    };

    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => {
      setLoading(true);
    };

    const handleCanPlayThrough = () => {
      setLoading(false);
    };

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('waiting', handleWaiting);

    // Load the audio
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, [url, audioManager]);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !url) return;

    const audio = audioRef.current;

    if (playing) {
      audio.pause();
    } else {
      setLoading(true);
      try {
        await audio.play();
      } catch (err) {
        console.error('Error playing audio:', err);
        setError(true);
        setLoading(false);
      }
    }
  }, [url, playing]);

  const stop = useCallback(() => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const reload = useCallback(() => {
    if (!audioRef.current || !url) return;
    
    setError(false);
    setLoading(true);
    
    const audio = audioRef.current;
    audio.load();
    
    if (playing) {
      setTimeout(() => {
        audio.play().catch(() => setError(true));
      }, 100);
    }
  }, [url, playing]);

  return {
    playing,
    duration,
    currentTime,
    togglePlay,
    stop,
    seek,
    error,
    loading,
    reload
  };
};
