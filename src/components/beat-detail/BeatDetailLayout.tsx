
import { useState } from "react";
import { ArrowLeft, Play, Pause, Heart, Share2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Beat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { BeatDetailHeader } from "./BeatDetailHeader";
import { BeatLicenseCards } from "./BeatLicenseCards";
import { BeatTagsSection } from "./BeatTagsSection";
import { BeatSimilarSection } from "./BeatSimilarSection";
import { ToggleFavoriteButton } from "@/components/buttons/ToggleFavoriteButton";

interface BeatDetailLayoutProps {
  beat: Beat;
}

export const BeatDetailLayout = ({ beat }: BeatDetailLayoutProps) => {
  const { currency } = useAuth();
  const { currentBeat, isPlaying, playBeat } = usePlayer();
  const [selectedLicense, setSelectedLicense] = useState<'basic' | 'premium' | 'exclusive'>('basic');
  
  const isCurrentBeat = currentBeat?.id === beat.id;
  
  const handlePlayToggle = () => {
    if (isCurrentBeat && isPlaying) {
      playBeat(null);
    } else {
      playBeat(beat);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <Link to="/">
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="text-sm text-gray-400">
          <span>Beats</span> • <span>afrobeat</span>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Beat Info Section */}
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={beat.cover_image_url || "/placeholder.svg"}
              alt={beat.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-2xl font-bold">{beat.title}</h1>
              <Link 
                to={`/producer/${beat.producer_id}`}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                {beat.producer_name}
              </Link>
            </div>
            
            {/* Beat Details */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{beat.bpm || 0} BPM</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{beat.genre}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>{beat.track_type || 'full_beat'}</span>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{beat.purchase_count || 0} downloads</span>
              </div>
              <div className="flex items-center gap-1">
                <Heart className="w-4 h-4" />
                <span>{beat.favorites_count || 0} likes</span>
              </div>
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{beat.plays || 0} plays</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handlePlayToggle}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6"
              >
                {isCurrentBeat && isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </>
                )}
              </Button>
              
              <ToggleFavoriteButton beatId={beat.id} />
              
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-800">
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tags and License Options Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <BeatTagsSection beat={beat} />
          <div>
            <h3 className="text-white font-medium mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              License Options
            </h3>
            <p className="text-gray-400 text-sm">
              Available licenses: Basic, Premium, Exclusive
            </p>
          </div>
        </div>

        {/* License Selection */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Choose a License</h2>
          <BeatLicenseCards 
            beat={beat} 
            currency={currency} 
            onLicenseSelect={setSelectedLicense}
            selectedLicense={selectedLicense}
          />
          <p className="text-xs text-gray-500">
            All licenses include producer credit. See the full{" "}
            <span className="text-purple-400 cursor-pointer">license terms</span> for details.
          </p>
        </div>

        {/* Similar Beats */}
        <BeatSimilarSection 
          currentBeatId={beat.id}
          genre={beat.genre}
          producerId={beat.producer_id}
        />
      </div>
    </div>
  );
};
