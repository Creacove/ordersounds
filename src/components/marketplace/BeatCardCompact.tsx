
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Beat } from '@/types';
import { PlayCircle, PauseCircle } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

interface BeatCardCompactProps {
  beat: Beat;
}

export const BeatCardCompact = ({ beat }: BeatCardCompactProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const { playing, togglePlay } = useAudio(beat.preview_url);
  
  return (
    <div 
      className="group relative rounded-lg overflow-hidden bg-card transition-all"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Link to={`/marketplace/beats/${beat.id}`} className="block">
        <div className="relative aspect-square">
          {/* Cover Image */}
          <img 
            src={beat.cover_image_url || 'https://placehold.co/600x600/1a1a1a/ffffff?text=Beat'} 
            alt={beat.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          
          {/* Play Button Overlay */}
          <button 
            onClick={(e) => {
              e.preventDefault();
              togglePlay();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {playing ? 
              <PauseCircle className="h-12 w-12 text-white" /> : 
              <PlayCircle className="h-12 w-12 text-white" />
            }
          </button>
        </div>
        
        <div className="p-3">
          <h3 className="font-medium line-clamp-1">{beat.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-1">{beat.producer_name}</p>
        </div>
      </Link>
    </div>
  );
};
