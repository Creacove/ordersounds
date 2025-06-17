
import { usePlayer } from '@/context/PlayerContext';
import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useCallback, useMemo } from 'react';
import { AudioManager } from '@/lib/audioManager';
import { toast } from 'sonner';

// Validate beat preview URL
const hasValidPreviewUrl = (beat: Beat): boolean => {
  if (!beat.preview_url) return false;
  
  try {
    new URL(beat.preview_url);
    return true;
  } catch {
    return false;
  }
};

export function useAudioPlayer() {
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  const audioManager = AudioManager.getInstance();
  
  const incrementPlayCount = useCallback(async (beatId: string) => {
    try {
      await supabase.rpc("increment_counter" as any, {
        p_table_name: "beats",
        p_column_name: "plays",
        p_id: beatId
      });
      console.log('Incremented play count for beat:', beatId);
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  }, []);

  const handlePlayBeat = useCallback(async (beat: Beat): Promise<void> => {
    console.log("Play button clicked for:", beat.title);
    
    try {
      const isCurrentBeat = currentBeat?.id === beat.id;
      
      if (isCurrentBeat) {
        console.log("Toggling current beat:", beat.title);
        togglePlayPause();
      } else {
        console.log("Playing new beat:", beat.title);
        
        // Validate preview URL before attempting to play
        if (!hasValidPreviewUrl(beat)) {
          console.warn("Beat doesn't have a valid preview URL:", beat.title, beat.preview_url);
          toast.error(`Cannot play "${beat.title}" - preview not available`);
          return;
        }
        
        // Ensure we stop any other playing audio first
        audioManager.stopAllAudio();
        
        playBeat(beat);
        
        // Increment play count only when starting a new track
        setTimeout(() => incrementPlayCount(beat.id), 1000);
      }
    } catch (error) {
      console.error("Error handling play:", error);
      toast.error(`Failed to play "${beat.title}"`);
    }
  }, [currentBeat, togglePlayPause, playBeat, incrementPlayCount, audioManager]);

  const isCurrentBeat = useCallback((beatId: string): boolean => {
    return currentBeat?.id === beatId;
  }, [currentBeat]);

  const isCurrentlyPlaying = useCallback((beatId: string): boolean => {
    return isCurrentBeat(beatId) && isPlaying;
  }, [isCurrentBeat, isPlaying]);

  // Memoize return object to prevent unnecessary re-renders
  const returnValue = useMemo(() => ({
    currentBeat,
    isPlaying,
    handlePlayBeat,
    isCurrentBeat,
    isCurrentlyPlaying,
    incrementPlayCount
  }), [currentBeat, isPlaying, handlePlayBeat, isCurrentBeat, isCurrentlyPlaying, incrementPlayCount]);

  return returnValue;
}
