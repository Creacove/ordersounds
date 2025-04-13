
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Pause, Heart, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useBeats } from "@/hooks/useBeats";
import { useFollows } from "@/hooks/useFollows";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ProducerOfWeek() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const { toggleFavorite, isFavorite } = useBeats();
  const { followProducer, unfollowProducer, isFollowing, refetchFollowStatus } = useFollows();
  
  const [producer, setProducer] = useState<any>(null);
  const [producerBeats, setProducerBeats] = useState<any[]>([]);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [isLoadingBeats, setIsLoadingBeats] = useState(true);
  const [isFollowingProducer, setIsFollowingProducer] = useState(false);

  // Fetch the producer of the week
  useEffect(() => {
    const fetchProducerOfWeek = async () => {
      setIsLoadingProducer(true);
      try {
        const { data, error } = await supabase
          .rpc('get_producer_of_week');

        if (error) {
          console.error('Error fetching producer of the week:', error);
          return;
        }

        if (data && data.length > 0) {
          setProducer(data[0]);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingProducer(false);
      }
    };

    fetchProducerOfWeek();
  }, []);

  // Fetch the producer's beats
  useEffect(() => {
    if (!producer) return;

    const fetchProducerBeats = async () => {
      setIsLoadingBeats(true);
      try {
        const { data, error } = await supabase
          .from('beats')
          .select(`
            id, 
            title, 
            producer_id,
            cover_image,
            audio_preview,
            audio_file,
            genre,
            track_type,
            bpm,
            tags,
            description,
            upload_date,
            favorites_count,
            purchase_count,
            status,
            basic_license_price_local,
            basic_license_price_diaspora,
            premium_license_price_local,
            premium_license_price_diaspora,
            exclusive_license_price_local,
            exclusive_license_price_diaspora
          `)
          .eq('producer_id', producer.id)
          .eq('status', 'published')
          .order('favorites_count', { ascending: false })
          .limit(4);

        if (error) {
          console.error('Error fetching producer beats:', error);
          return;
        }

        // Transform the beats data to match our Beat interface
        const transformedBeats = data.map(beat => ({
          id: beat.id,
          title: beat.title,
          producer_id: beat.producer_id,
          producer_name: producer.stage_name || producer.full_name,
          cover_image_url: beat.cover_image,
          preview_url: beat.audio_preview,
          full_track_url: beat.audio_file,
          genre: beat.genre,
          track_type: beat.track_type,
          bpm: beat.bpm,
          tags: beat.tags || [],
          description: beat.description,
          created_at: beat.upload_date,
          favorites_count: beat.favorites_count || 0,
          purchase_count: beat.purchase_count || 0,
          status: beat.status as 'draft' | 'published',
          is_featured: false,
          basic_license_price_local: beat.basic_license_price_local || 0,
          basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
          premium_license_price_local: beat.premium_license_price_local || 0,
          premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
          exclusive_license_price_local: beat.exclusive_license_price_local || 0,
          exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0
        }));

        setProducerBeats(transformedBeats);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoadingBeats(false);
      }
    };

    fetchProducerBeats();
  }, [producer]);

  // Check if user is following the producer
  useEffect(() => {
    if (!user || !producer) return;

    const checkFollowStatus = async () => {
      try {
        const isCurrentlyFollowing = await isFollowing(producer.id);
        setIsFollowingProducer(isCurrentlyFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, producer, isFollowing]);

  const handleToggleFollow = async () => {
    if (!user) {
      toast.error("Please log in to follow producers");
      navigate('/login');
      return;
    }

    if (!producer) return;

    try {
      if (isFollowingProducer) {
        await unfollowProducer(producer.id);
        setIsFollowingProducer(false);
        toast.success(`Unfollowed ${producer.stage_name || producer.full_name}`);
      } else {
        await followProducer(producer.id);
        setIsFollowingProducer(true);
        toast.success(`Now following ${producer.stage_name || producer.full_name}`);
      }
      
      // Refetch follow status to ensure UI is in sync
      await refetchFollowStatus(producer.id);
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast.error("Failed to update follow status");
    }
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };

  const handleToggleFavorite = async (beatId) => {
    if (!user) {
      toast.error("Please log in to add favorites");
      navigate('/login');
      return;
    }
    
    try {
      await toggleFavorite(beatId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error("Failed to update favorite status");
    }
  };

  const navigateToProducerProfile = () => {
    if (producer) {
      navigate(`/producer/${producer.id}`);
    }
  };

  const navigateToBeat = (beatId) => {
    navigate(`/beat/${beatId}`);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num;
  };

  if (isLoadingProducer) {
    return (
      <div className="h-[250px] bg-card/60 border rounded-lg flex items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Loading producer data...</div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="bg-card/60 border rounded-lg p-6">
        <div className="text-sm text-muted-foreground">No producer of the week selected</div>
      </div>
    );
  }

  const producerName = producer.stage_name || producer.full_name;
  const producerImage = producer.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png';

  return (
    <div className="bg-card/60 rounded-lg border overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Producer Info */}
        <div className="p-6 flex flex-col md:w-2/5 border-b md:border-b-0 md:border-r">
          <div className="flex items-center gap-3 mb-4">
            <Avatar 
              className="h-16 w-16 rounded-full cursor-pointer border-2 border-primary/20 hover:border-primary/50 transition-colors" 
              onClick={navigateToProducerProfile}
            >
              <AvatarImage src={producerImage} alt={producerName} />
              <AvatarFallback>{producerName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div 
                className="text-lg font-semibold flex items-center gap-1 cursor-pointer hover:text-primary transition-colors"
                onClick={navigateToProducerProfile}
              >
                {producerName}
                {producer.status === 'active' && (
                  <Badge variant="outline" className="ml-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
                    <Check size={10} className="mr-1" />
                    <span className="text-[10px]">Verified</span>
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(producer.follower_count || 0)} followers
              </div>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {producer.bio || "Award-winning producer specializing in various music genres. Creating exceptional beats for artists worldwide."}
          </p>
          
          <div className="mt-auto">
            <Button 
              variant={isFollowingProducer ? "outline" : "default"} 
              className="w-full"
              onClick={handleToggleFollow}
            >
              {isFollowingProducer ? "Unfollow" : "Follow Producer"}
            </Button>
          </div>
        </div>
        
        {/* Producer Beats */}
        <div className="p-6 md:w-3/5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-sm">Top Beats by {producerName}</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-primary hover:text-primary/80"
              onClick={navigateToProducerProfile}
            >
              View all <ChevronRight size={15} />
            </Button>
          </div>

          {isLoadingBeats ? (
            <div className="h-[150px] flex items-center justify-center">
              <div className="animate-pulse text-sm text-muted-foreground">Loading beats...</div>
            </div>
          ) : producerBeats.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4">
              No beats available from this producer
            </div>
          ) : (
            <div className="space-y-3">
              {producerBeats.map((beat) => (
                <div 
                  key={beat.id} 
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigateToBeat(beat.id)}
                >
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <img 
                      src={beat.cover_image_url || '/placeholder.svg'} 
                      alt={beat.title}
                      className="h-full w-full object-cover rounded"
                    />
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col">
                    <span className="font-medium text-sm truncate">{beat.title}</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{beat.genre || "Genre"}</span>
                      <span>•</span>
                      <span>{beat.bpm} BPM</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayBeat(beat);
                      }}
                    >
                      {isPlaying && currentBeat?.id === beat.id ? (
                        <Pause size={15} />
                      ) : (
                        <Play size={15} className="ml-0.5" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        "h-7 w-7",
                        isFavorite(beat.id) ? "text-purple-500" : ""
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(beat.id);
                      }}
                    >
                      <Heart 
                        size={15} 
                        fill={isFavorite(beat.id) ? "currentColor" : "none"} 
                      />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
