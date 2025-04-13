
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Play, Pause, Heart, UserCheck, Music, Headphones } from "lucide-react";
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
    <div className="overflow-hidden rounded-xl shadow-md border border-purple-500/20">
      {/* Hero Banner with Producer Showcase */}
      <div className="relative bg-gradient-to-br from-purple-900 to-blue-900 h-[320px] md:h-[360px] flex items-center justify-center">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[40%] -right-[15%] w-[80%] h-[80%] rounded-full bg-purple-500/20 blur-3xl"></div>
          <div className="absolute -bottom-[40%] -left-[15%] w-[80%] h-[80%] rounded-full bg-blue-500/20 blur-3xl"></div>
          <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>
        
        {/* Producer showcase content */}
        <div className="relative z-10 flex flex-col items-center px-4">
          {/* Featured Badge */}
          <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 mb-6 px-3 py-1.5 shadow-glow">
            <Star size={14} fill="currentColor" className="mr-1" />
            Producer of the Week
          </Badge>
          
          {/* Large Producer Image */}
          <div className="relative mb-5">
            <Avatar className="w-48 h-48 sm:w-56 sm:h-56 border-4 border-white/10 shadow-xl rounded-full overflow-hidden">
              <AvatarImage 
                src={producerImage} 
                alt={producerName} 
                className="w-full h-full object-cover object-center"
              />
              <AvatarFallback className="bg-purple-600 text-white text-5xl font-bold">
                {producerName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {producer.status === 'active' && (
              <div className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow-md border-2 border-background">
                <UserCheck size={20} />
              </div>
            )}
          </div>
          
          {/* Producer Name */}
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 text-center">
            {producerName}
          </h2>
          
          {/* Producer Stats */}
          <div className="flex items-center gap-6 text-white/80 mb-4">
            <div className="flex items-center gap-1.5">
              <Headphones size={18} className="text-purple-300" />
              <span>{formatNumber(producer.follower_count || 0)} followers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Music size={18} className="text-purple-300" />
              <span>{formatNumber(producerBeats.length)} tracks</span>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-2">
            <Button
              variant={isFollowingProducer ? "secondary" : "default"}
              size="lg"
              className={cn(
                "shadow-md",
                isFollowingProducer ? 
                "bg-white/15 hover:bg-white/25 text-white border-white/20" : 
                "bg-white hover:bg-white/90 text-purple-900"
              )}
              onClick={handleToggleFollow}
            >
              {isFollowingProducer ? (
                <span className="flex items-center gap-2">
                  <UserCheck size={18} />
                  Following
                </span>
              ) : "Follow Producer"}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white shadow-md"
              onClick={navigateToProducerProfile}
            >
              View Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Producer Content Section */}
      <div className="bg-background p-6 sm:p-8">
        {/* Short Bio */}
        <div className="max-w-2xl mx-auto text-center mb-8">
          <p className="text-base text-muted-foreground">
            {producer.bio || "Award-winning producer specializing in various music genres. Creating exceptional beats for artists worldwide."}
          </p>
          
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["Hip Hop", "Afrobeat", "R&B"].map((tag) => (
              <Badge key={tag} variant="outline" className="bg-purple-950/30 text-purple-200 dark:bg-purple-900/40 dark:text-purple-100 border-purple-700/30">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Producer Beats Section */}
        <div className="mt-8">
          <h3 className="font-bold text-xl mb-6 flex items-center gap-2">
            <span className="h-6 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></span>
            Top Beats from {producerName}
          </h3>

          {isLoadingBeats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card animate-pulse rounded-lg overflow-hidden h-[120px]">
                  <div className="flex h-full">
                    <div className="w-[120px] h-full bg-muted"></div>
                    <div className="flex-1 p-4 space-y-3">
                      <div className="h-4 bg-muted rounded-md w-3/4"></div>
                      <div className="h-3 bg-muted rounded-md w-1/2"></div>
                      <div className="h-3 bg-muted rounded-md w-1/4"></div>
                    </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {producerBeats.slice(0, 4).map((beat) => (
                <Card 
                  key={beat.id} 
                  className={cn(
                    "group overflow-hidden hover:shadow-md transition-all duration-300 border-purple-200/50 dark:border-purple-900/50",
                    isCurrentlyPlaying(beat.id) ? "border-purple-500 shadow-[0_0_0_1px_rgba(168,85,247,0.4)]" : ""
                  )}
                  onClick={() => navigateToBeat(beat.id)}
                >
                  <div className="flex flex-col h-full">
                    {/* Album Art */}
                    <div className="relative w-full aspect-square bg-gradient-to-br from-purple-900/10 to-blue-900/10 overflow-hidden">
                      <img 
                        src={beat.cover_image_url || '/placeholder.svg'} 
                        alt={beat.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayBeat(beat);
                          }}
                        >
                          {isCurrentlyPlaying(beat.id) ? (
                            <Pause size={20} />
                          ) : (
                            <Play size={20} className="ml-1" />
                          )}
                        </Button>
                      </div>
                      {/* Price tag */}
                      <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                      </div>
                    </div>
                    
                    {/* Beat Info */}
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-base truncate">{beat.title}</h4>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge variant="outline" className="text-xs py-0 px-2 h-5 bg-purple-950/30 text-purple-200 dark:bg-purple-900/40 dark:text-purple-100 border-purple-700/30">
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
                            "h-8 w-8 flex-shrink-0",
                            isFavorite(beat.id) ? "text-purple-500" : ""
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(beat.id);
                          }}
                        >
                          <Heart 
                            size={18}
                            fill={isFavorite(beat.id) ? "currentColor" : "none"} 
                          />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          )}
          
          {/* View All Button */}
          {producerBeats.length > 0 && (
            <div className="flex justify-center mt-8">
              <Button 
                variant="outline" 
                className="border-purple-300/30 hover:border-purple-400 dark:border-purple-800/50 dark:hover:border-purple-700"
                onClick={navigateToProducerProfile}
              >
                View All Beats from {producerName}
              </Button>
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
