
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  setVolume: (volume: number) => void;
}

export function VolumeControl({ volume, setVolume }: VolumeControlProps) {
  const VolumeIcon = volume === 0 
    ? VolumeX 
    : volume < 0.5 
      ? Volume1 
      : Volume2;

  return (
    <div className="flex items-center gap-2 w-24">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
        aria-label={volume === 0 ? "Unmute" : "Mute"}
      >
        <VolumeIcon size={16} />
      </Button>
      
      <div className="relative w-full h-1 bg-muted rounded-full overflow-hidden group">
        <div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all"
          style={{ width: `${volume * 100}%` }}
        />
        <div className="absolute top-0 left-0 h-full w-full opacity-0 cursor-pointer" 
          onClick={(e) => {
            const container = e.currentTarget;
            const rect = container.getBoundingClientRect();
            const clickPosition = e.clientX - rect.left;
            const percentage = clickPosition / rect.width;
            setVolume(Math.max(0, Math.min(1, percentage)));
          }}
        />
        <input 
          type="range"
          id="volume-control"
          name="volumeControl"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Volume control"
        />
      </div>
    </div>
  );
}
