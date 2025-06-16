
import { useState } from "react";
import { ArrowLeft, Play, Pause, Heart, Share2, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Beat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { formatCurrency } from "@/lib/utils";
import { BeatDetailHeader } from "./BeatDetailHeader";
import { LicenseOptionCards } from "./LicenseOptionCards";
import { ProducerInfoSection } from "./ProducerInfoSection";
import { SimilarBeatsGrid } from "./SimilarBeatsGrid";
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
    <div className="min-h-screen bg-background">
      <BeatDetailHeader beatTitle={beat.title} producerName={beat.producer_name} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Album Art and Controls */}
          <div className="space-y-6">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-900 to-blue-900">
              <img
                src={beat.cover_image_url || "/placeholder.svg"}
                alt={beat.title}
                className="w-full h-full object-cover"
              />
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Button
                  size="icon"
                  variant="default"
                  className="w-16 h-16 rounded-full bg-white/90 hover:bg-white text-black"
                  onClick={handlePlayToggle}
                >
                  {isCurrentBeat && isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </Button>
              </div>
              
              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex gap-2">
                <ToggleFavoriteButton beatId={beat.id} />
                <Button size="icon" variant="secondary" className="rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Beat Info */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{beat.title}</h1>
                <Link 
                  to={`/producer/${beat.producer_id}`}
                  className="text-lg text-muted-foreground hover:text-primary transition-colors"
                >
                  by {beat.producer_name}
                </Link>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{beat.genre}</Badge>
                <Badge variant="outline">{beat.track_type}</Badge>
                <Badge variant="outline">{beat.bpm} BPM</Badge>
                {beat.key && <Badge variant="outline">{beat.key}</Badge>}
                {beat.tags?.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
              
              {/* Stats */}
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>{beat.plays || 0} plays</span>
                <span>{beat.favorites_count || 0} likes</span>
                <span>{beat.purchase_count || 0} purchases</span>
              </div>
              
              {/* Description */}
              {beat.description && (
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{beat.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - License Options */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Choose Your License</h2>
              <p className="text-muted-foreground mb-6">
                Select the license that best fits your needs. All licenses include high-quality audio files.
              </p>
            </div>
            
            <LicenseOptionCards 
              beat={beat} 
              currency={currency} 
              onLicenseSelect={setSelectedLicense}
              selectedLicense={selectedLicense}
            />
          </div>
        </div>
        
        {/* Producer Section */}
        <ProducerInfoSection 
          producerId={beat.producer_id} 
          producerName={beat.producer_name} 
        />
        
        {/* Similar Beats */}
        <SimilarBeatsGrid 
          currentBeatId={beat.id}
          genre={beat.genre}
          producerId={beat.producer_id}
        />
      </div>
    </div>
  );
};
