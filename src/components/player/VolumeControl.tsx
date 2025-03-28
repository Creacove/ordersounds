
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

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
    <div className="flex items-center gap-1 md:gap-2 sm:w-20 hidden sm:flex">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 rounded-full" 
        onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
      >
        <VolumeIcon size={16} />
      </Button>
      
      <div className="relative w-full h-1 bg-muted rounded-full">
        <div 
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          style={{ width: `${volume * 100}%` }}
        />
        <input 
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
