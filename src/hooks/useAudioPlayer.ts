
import { usePlayer } from '@/context/PlayerContext';
import { Beat } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useAudioPlayer() {
  const { currentBeat, isPlaying, togglePlayPause, playBeat } = usePlayer();
  
  const incrementPlayCount = async (beatId: string) => {
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
  };

  const handlePlayBeat = async (beat: Beat): Promise<void> => {
    console.log("Play button clicked for:", beat.title);
    
    try {
      const isCurrentBeat = currentBeat?.id === beat.id;
      
      if (isCurrentBeat) {
        console.log("Toggling current beat:", beat.title);
        togglePlayPause();
      } else {
        console.log("Playing new beat:", beat.title);
        // Ensure we have a preview URL before attempting to play
        if (!beat.preview_url) {
          console.warn("Beat doesn't have a preview URL:", beat.title);
          return;
        }
        
        // Play the beat and increment play count
        playBeat(beat);
        incrementPlayCount(beat.id);
      }
    } catch (error) {
      console.error("Error handling play:", error);
    }
  };

  const isCurrentBeat = (beatId: string): boolean => {
    return currentBeat?.id === beatId;
  };

  const isCurrentlyPlaying = (beatId: string): boolean => {
    return isCurrentBeat(beatId) && isPlaying;
  };

  return {
    currentBeat,
    isPlaying,
    handlePlayBeat,
    isCurrentBeat,
    isCurrentlyPlaying,
    incrementPlayCount
  };
}
