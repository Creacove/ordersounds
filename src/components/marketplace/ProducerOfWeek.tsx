
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Pause, Heart, UserCheck, TrendingUp, Headphones, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useBeats } from "@/hooks/useBeats";
import { useFollows } from "@/hooks/useFollows";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export function ProducerOfWeek() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const { toggleFavorite, isFavorite } = useBeats();
  const { followProducer, unfollowProducer, useFollowStatus } = useFollows();
  
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
        // Use the hook correctly - check if the user is currently following the producer
        const { data: isFollowing } = useFollowStatus(producer.id);
        
        setIsFollowingProducer(!!isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      }
    };

    checkFollowStatus();
  }, [user, producer, useFollowStatus]);

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
      <div className="h-[300px] bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-xl flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-primary/20"></div>
          <div className="h-4 w-40 bg-primary/20 rounded"></div>
          <div className="text-sm text-muted-foreground">Loading featured producer...</div>
        </div>
      </div>
    );
  }

  if (!producer) {
    return (
      <div className="bg-card/60 border rounded-lg p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <Music size={32} className="text-muted-foreground" />
          <div className="text-lg font-medium">No featured producer this week</div>
          <div className="text-sm text-muted-foreground">Check back later for updates</div>
        </div>
      </div>
    );
  }

  const producerName = producer.stage_name || producer.full_name;
  const producerImage = producer.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png';

  return (
    <div className="overflow-hidden rounded-xl shadow-lg border border-purple-500/30">
      {/* Hero Section with Large Producer Image */}
      <div className="relative h-72 md:h-80 w-full flex flex-col justify-end overflow-hidden">
        {/* Background Image - Blurred */}
        <div className="absolute inset-0 z-0">
          <img 
            src={producerImage} 
            alt={producerName}
            className="w-full h-full object-cover object-center blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/50 via-purple-800/70 to-background" />
          <div className="absolute inset-0 [background:radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
        </div>
        
        {/* Featured Badge */}
        <div className="absolute top-4 right-4">
          <Badge className="bg-white/90 dark:bg-black/80 text-purple-700 dark:text-purple-400 shadow-md flex items-center gap-1 px-3 py-1.5 text-xs">
            <Star size={14} fill="currentColor" />
            <span>Producer of the Week</span>
          </Badge>
        </div>
        
        {/* Large Producer Image - Centered */}
        <div className="relative z-10 flex flex-col items-center mb-6">
          <Avatar className="w-32 h-32 border-4 border-background shadow-xl rounded-full overflow-hidden">
            <AvatarImage 
              src={producerImage} 
              alt={producerName} 
              className="w-full h-full object-cover object-center"
            />
            <AvatarFallback className="bg-purple-600 text-white text-3xl font-bold">
              {producerName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {producer.status === 'active' && (
            <div className="absolute bottom-0 right-1/2 translate-x-12 bg-blue-500 text-white rounded-full p-1.5 shadow-md border-2 border-background">
              <UserCheck size={18} />
            </div>
          )}
        </div>
      </div>

      {/* Producer Info */}
      <div className="bg-background px-6 py-4 -mt-6 rounded-t-3xl">
        <div className="text-center mb-6">
          <h3 
            className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent cursor-pointer"
            onClick={navigateToProducerProfile}
          >
            {producerName}
          </h3>
          
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Headphones size={16} className="text-purple-400" />
              <span>{formatNumber(producer.follower_count || 0)} followers</span>
            </div>
            <div className="flex items-center gap-1">
              <Music size={16} className="text-purple-400" />
              <span>{formatNumber(producerBeats.length)} tracks</span>
            </div>
          </div>
          
          <div className="mt-4 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground mb-4">
              {producer.bio || "Award-winning producer specializing in various music genres. Creating exceptional beats for artists worldwide."}
            </p>
            
            <div className="flex justify-center gap-3 mb-4">
              <Button
                variant={isFollowingProducer ? "secondary" : "default"}
                className={cn(
                  isFollowingProducer ? 
                  "bg-purple-200 hover:bg-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-800 dark:text-purple-300" : 
                  "bg-purple-600 hover:bg-purple-700"
                )}
                onClick={handleToggleFollow}
              >
                {isFollowingProducer ? (
                  <span className="flex items-center gap-1">
                    <UserCheck size={16} />
                    Following
                  </span>
                ) : "Follow Producer"}
              </Button>
              <Button
                variant="outline"
                className="border-purple-200 hover:border-purple-300 dark:border-purple-800 dark:hover:border-purple-700"
                onClick={navigateToProducerProfile}
              >
                View Profile
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {["Hip Hop", "Afrobeat", "R&B"].map((tag) => (
                <Badge key={tag} variant="outline" className="bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Producer Beats */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <TrendingUp size={18} className="text-purple-500" /> 
              Top Beats
            </h3>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
              onClick={navigateToProducerProfile}
            >
              View all beats
            </Button>
          </div>

          {isLoadingBeats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 bg-card/60 p-3 rounded-lg">
                  <div className="h-14 w-14 rounded bg-primary/10"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-primary/10 rounded w-3/4"></div>
                    <div className="h-3 bg-primary/10 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : producerBeats.length === 0 ? (
            <div className="bg-card/60 rounded-lg p-6 text-center">
              <div className="text-sm text-muted-foreground">
                No beats available from this producer
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {producerBeats.map((beat) => (
                <Card 
                  key={beat.id} 
                  className={cn(
                    "group overflow-hidden hover:shadow-md transition-all duration-300 border-purple-200/50 dark:border-purple-900/50",
                    isCurrentlyPlaying(beat.id) ? "border-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,0.4)]" : ""
                  )}
                  onClick={() => navigateToBeat(beat.id)}
                >
                  <CardContent className="p-0 flex items-center">
                    <div className="relative h-16 w-16 flex-shrink-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 overflow-hidden">
                      <img 
                        src={beat.cover_image_url || '/placeholder.svg'} 
                        alt={beat.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className={cn(
                        "absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity",
                        isCurrentlyPlaying(beat.id) ? "opacity-100" : ""
                      )}>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full bg-white/20 text-white hover:bg-white/30"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayBeat(beat);
                          }}
                        >
                          {isCurrentlyPlaying(beat.id) ? (
                            <Pause size={15} />
                          ) : (
                            <Play size={15} className="ml-0.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="p-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-sm truncate pr-2">{beat.title}</h4>
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 bg-purple-50 dark:bg-purple-900/30 border-purple-200/50 dark:border-purple-900/50">
                              {beat.genre || "Genre"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {beat.bpm} BPM
                            </span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className={cn(
                            "h-7 w-7 flex-shrink-0",
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
                      <div className="mt-1.5 text-xs text-muted-foreground">
                        ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  function isCurrentlyPlaying(beatId) {
    return isPlaying && currentBeat?.id === beatId;
  }
}
