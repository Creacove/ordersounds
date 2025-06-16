import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, Heart, UserCheck, Music, Star, ArrowRight, Headphones, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useBeats } from "@/hooks/useBeats";
import { useFollows } from "@/hooks/useFollows";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export function ProducerOfWeek() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const { toggleFavorite, isFavorite } = useBeats();
  const { followProducer, unfollowProducer } = useFollows();
  
  const [producer, setProducer] = useState<any>(null);
  const [producerBeats, setProducerBeats] = useState<any[]>([]);
  const [isLoadingProducer, setIsLoadingProducer] = useState(true);
  const [isLoadingBeats, setIsLoadingBeats] = useState(true);
  const [isFollowingProducer, setIsFollowingProducer] = useState(false);

  // Move useFollowStatus to top level - this fixes the hook violation
  const { data: followStatus } = useFollows().useFollowStatus(producer?.id);

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

  // Update follow status when followStatus changes - this replaces the problematic useEffect
  useEffect(() => {
    if (followStatus !== undefined) {
      setIsFollowingProducer(!!followStatus);
    }
  }, [followStatus]);

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
    <div className="overflow-hidden rounded-xl border border-purple-500/20 bg-background/95">
      <div className="grid grid-cols-1 md:grid-cols-12">
        {/* Left side - Producer Image & Info */}
        <div className="md:col-span-4 lg:col-span-3 relative bg-gradient-to-br from-purple-950 to-black h-full">
          {/* Producer Image - Takes the entire left rectangle */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="w-full h-full">
              <img 
                src={producerImage} 
                alt={producerName}
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent opacity-70" />
              <div className="absolute inset-0 bg-purple-950/40" />
            </div>
          </div>

          {/* Producer Info Overlay */}
          <div className="relative z-10 flex flex-col h-full p-6 justify-end space-y-5">
            {/* Featured Badge */}
            <Badge className="absolute top-4 left-4 bg-amber-500/90 text-white hover:bg-amber-500 border-none shadow-lg w-fit">
              <Star size={14} fill="currentColor" className="mr-1" />
              <span>Featured</span>
            </Badge>

            {/* Producer Name with Verified Badge */}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {producerName}
              </h2>
              {producer.status === 'active' && (
                <CheckCircle2 size={20} className="text-blue-400 fill-blue-900" />
              )}
            </div>

            {/* Stats - Followers & Beats Count */}
            <div className="flex items-center gap-5 text-sm text-white/80">
              <div className="flex items-center gap-1.5">
                <Headphones size={16} className="text-purple-300" />
                <span>{formatNumber(producer.follower_count || 0)} followers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Music size={16} className="text-purple-300" />
                <span>{formatNumber(producerBeats.length)} beats</span>
              </div>
            </div>

            {/* Short Bio */}
            <p className="text-sm text-white/70 line-clamp-3">
              {producer.bio || "Award-winning producer specializing in Afrobeat and Amapiano fusion. Worked with top artists across Nigeria and beyond."}
            </p>

            {/* Follow Button */}
            <Button
              onClick={handleToggleFollow}
              variant={isFollowingProducer ? "secondary" : "default"}
              className={cn(
                "w-full shadow-md justify-center",
                isFollowingProducer 
                  ? "bg-white/15 hover:bg-white/25 text-white border-white/20" 
                  : "bg-white hover:bg-white/90 text-purple-900"
              )}
            >
              <UserCheck size={18} className={isFollowingProducer ? "" : "mr-2"} />
              {isFollowingProducer ? null : <span>Follow Producer</span>}
            </Button>
          </div>
        </div>

        {/* Right side - Top Beats Table */}
        <div className="md:col-span-8 lg:col-span-9 p-0 h-full">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-purple-200/10">
              <h3 className="font-bold text-lg flex items-center">
                <span>Top Beats by {producerName}</span>
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 -mr-2"
                onClick={navigateToProducerProfile}
              >
                View profile <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>

            {/* Beats Table */}
            {isLoadingBeats ? (
              <div className="p-6 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[50px] bg-muted/30 animate-pulse rounded-md"></div>
                ))}
              </div>
            ) : producerBeats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center text-muted-foreground">
                  <Music size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No beats available from this producer</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <Table className="border-collapse">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="w-[40%] lg:w-1/3 text-muted-foreground font-medium">Title</TableHead>
                      <TableHead className="hidden sm:table-cell w-[15%] text-muted-foreground font-medium">Genre</TableHead>
                      <TableHead className="hidden sm:table-cell w-[15%] text-muted-foreground font-medium">BPM</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Price</TableHead>
                      <TableHead className="text-right text-muted-foreground font-medium w-[15%]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {producerBeats.map((beat) => {
                      const isCurrentlyPlaying = isPlaying && currentBeat?.id === beat.id;
                      const isFav = isFavorite(beat.id);
                      
                      return (
                        <TableRow 
                          key={beat.id} 
                          className="group hover:bg-muted/40 cursor-pointer border-t border-t-border/30"
                          onClick={() => navigateToBeat(beat.id)}
                        >
                          {/* Title with Cover Image */}
                          <TableCell className="font-medium p-3">
                            <div className="flex items-center gap-3">
                              <div className="relative w-10 h-10 overflow-hidden rounded bg-muted flex-shrink-0">
                                <img 
                                  src={beat.cover_image_url || '/placeholder.svg'} 
                                  alt={beat.title}
                                  className="w-full h-full object-cover" 
                                />
                                {/* Owned Label */}
                                {isPurchased(beat.id) && (
                                  <div className="absolute top-0 left-0 bg-green-500 text-[10px] text-white px-1 py-0.5">
                                    Owned
                                  </div>
                                )}
                              </div>
                              <span className="line-clamp-1">{beat.title}</span>
                            </div>
                          </TableCell>

                          {/* Genre */}
                          <TableCell className="hidden sm:table-cell p-3">
                            <Badge variant="outline" className="bg-purple-950/30 text-purple-200 dark:bg-purple-900/40 dark:text-purple-100 border-purple-700/30">
                              {beat.genre}
                            </Badge>
                          </TableCell>

                          {/* BPM */}
                          <TableCell className="hidden sm:table-cell p-3">
                            {beat.bpm} BPM
                          </TableCell>

                          {/* Price */}
                          <TableCell className="p-3">
                            ₦{(beat.basic_license_price_local || 0).toLocaleString()}
                          </TableCell>

                          {/* Actions */}
                          <TableCell className="text-right p-3">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayBeat(beat);
                                }}
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 rounded-full"
                              >
                                {isCurrentlyPlaying ? <Pause size={16} /> : <Play size={16} />}
                              </Button>
                              
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(beat.id);
                                }}
                                size="icon"
                                variant="ghost"
                                className={cn(
                                  "h-8 w-8 rounded-full",
                                  isFav ? "text-purple-500" : ""
                                )}
                              >
                                <Heart size={16} fill={isFav ? "currentColor" : "none"} />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {/* Browse All Link */}
                <div className="p-4 text-center border-t border-t-border/30">
                  <Button 
                    variant="link" 
                    className="text-purple-500 hover:text-purple-400 font-medium"
                    onClick={navigateToProducerProfile}
                  >
                    Browse all beats from this producer <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper function to check if a beat is purchased
  function isPurchased(beatId) {
    // This should be implemented based on your app's logic
    // For now, we'll return false as a placeholder
    return false;
  }
}
