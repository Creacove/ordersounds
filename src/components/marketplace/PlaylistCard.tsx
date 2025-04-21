
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Playlist } from "@/types";

interface PlaylistCardProps {
  playlist: {
    id: string;
    title?: string;
    name?: string;
    color?: string;
    image?: string;
    cover_image?: string;
    tracks?: number;
    beats?: string[];
  } | Playlist;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist }) => {
  const gradientClass = (playlist as any).color || "from-purple-600 to-blue-600";
  const playlistName = (playlist as any).title || (playlist as any).name || "Unnamed Playlist";
  const trackCount = (playlist as any).tracks || ((playlist as any).beats ? (playlist as any).beats.length : 0);
  const coverImage = (playlist as any).image || (playlist as any).cover_image;
  
  return (
    <Link to={`/playlist/${playlist.id}`} className="block rounded-lg overflow-hidden group">
      <div className={`aspect-square bg-gradient-to-br ${gradientClass} relative`}>
        {coverImage && (
          <img 
            src={coverImage} 
            alt={playlistName} 
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
        <div className="p-4 flex flex-col h-full justify-between relative z-10">
          <div className="flex justify-end">
            <Badge variant="outline" className="bg-white/20 text-white border-white/10">
              {trackCount} tracks
            </Badge>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{playlistName}</h3>
            <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                <Play size={14} className="mr-1" /> Listen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
