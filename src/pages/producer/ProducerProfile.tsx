
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { 
  MapPin, 
  Calendar, 
  Share2, 
  MessageSquare, 
  BarChart4,
  Music,
  Store,
  Heart
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { useQuery } from "@tanstack/react-query";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { useFollows } from "@/hooks/useFollows";

interface ProducerProfileData {
  id: string;
  full_name: string;
  stage_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  created_at: string;
  follower_count: number;
  sale_count?: number;
}

export default function ProducerProfile() {
  const { producerId } = useParams<{ producerId: string }>();
  const { user: currentUser } = useAuth();
  const [followerCount, setFollowerCount] = useState(0);
  const { useFollowStatus } = useFollows();
  const { data: isFollowing } = useFollowStatus(producerId);
  
  // Fetch producer data
  const { 
    data: producer, 
    isLoading: isLoadingProducer 
  } = useQuery({
    queryKey: ['producer', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, stage_name, bio, avatar_url, country, created_at, follower_count')
        .eq('id', producerId)
        .eq('role', 'producer')
        .single();
        
      if (error) throw error;
      
      // Set initial follower count
      setFollowerCount(data.follower_count || 0);
      
      return data as ProducerProfileData;
    },
    enabled: !!producerId,
  });
  
  // Fetch producer beats
  const { 
    data: beats, 
    isLoading: isLoadingBeats 
  } = useQuery({
    queryKey: ['producerBeats', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', producerId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Map the data to match the Beat type
      return data.map(beat => ({
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: producer?.stage_name || producer?.full_name || "",
        cover_image_url: beat.cover_image || "",
        preview_url: beat.audio_preview || "",
        full_track_url: beat.audio_file || "",
        genre: beat.genre || "",
        track_type: beat.track_type || "",
        bpm: beat.bpm || 0,
        tags: beat.tags || [],
        description: beat.description || "",
        created_at: beat.upload_date || "",
        updated_at: beat.upload_date || "",
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        status: beat.status || "published",
        is_featured: false,
        license_type: beat.license_type || "basic",
        license_terms: beat.license_terms || "",
        basic_license_price_local: beat.basic_license_price_local || 0,
        basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
        premium_license_price_local: beat.premium_license_price_local || 0,
        premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
        exclusive_license_price_local: beat.exclusive_license_price_local || 0,
        exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
        custom_license_price_local: beat.custom_license_price_local || 0,
        custom_license_price_diaspora: beat.custom_license_price_diaspora || 0,
        plays: beat.plays || 0,
        key: beat.key || "",
        duration: ""
      })) as Beat[];
    },
    enabled: !!producerId,
  });
  
  // Handle follow status change
  const handleFollowChange = (newFollowState: boolean) => {
    setFollowerCount(prev => newFollowState ? prev + 1 : Math.max(0, prev - 1));
  };
  
  // Update document title
  useEffect(() => {
    if (producer) {
      const producerName = producer.stage_name || producer.full_name;
      document.title = `${producerName} | Music Producer | OrderSOUNDS`;
    } else {
      document.title = 'Producer Profile | OrderSOUNDS';
    }
    
    return () => {
      document.title = 'OrderSOUNDS';
    };
  }, [producer]);
  
  // Format join date
  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
  };
  
  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        {isLoadingProducer ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ) : producer ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 to-background h-40 rounded-xl -z-10"></div>
              <div className="flex flex-col md:flex-row gap-6 pt-6 mb-8">
                <div className="flex-shrink-0 md:ml-8">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={producer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`} />
                    <AvatarFallback className="bg-purple-500 text-2xl">
                      {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 md:mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {producer.stage_name || producer.full_name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                        {producer.country && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin size={14} />
                            {producer.country}
                          </span>
                        )}
                        <FollowerCount 
                          count={followerCount} 
                          className="text-sm"
                        />
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          Joined {formatJoinDate(producer.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {currentUser?.id !== producerId && (
                        <>
                          <FollowButton 
                            producerId={producerId || ''} 
                            initialFollowState={isFollowing}
                            onFollowChange={handleFollowChange}
                          />
                          <Button variant="secondary" className="gap-1.5" size="sm">
                            <Share2 size={14} />
                            Share
                          </Button>
                          <Button variant="secondary" className="gap-1.5" size="sm">
                            <MessageSquare size={14} />
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {producer.bio ? (
                    <p className="text-sm md:text-base mb-4 max-w-3xl">{producer.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic mb-4 text-sm md:text-base">
                      This producer hasn't added a bio yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tabs section */}
            <Tabs defaultValue="beats" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="beats" className="gap-2">
                  <Music size={16} />
                  Beats
                </TabsTrigger>
                <TabsTrigger value="popular" className="gap-2">
                  <Heart size={16} />
                  Popular
                </TabsTrigger>
                <TabsTrigger value="about" className="gap-2">
                  <BarChart4 size={16} />
                  About
                </TabsTrigger>
              </TabsList>
              
              {/* Beats Tab */}
              <TabsContent value="beats" className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    All Beats ({beats?.length || 0})
                  </h2>
                  <select className="bg-background border border-input rounded-md px-3 py-1 text-sm">
                    <option>Sort by: Newest</option>
                    <option>Sort by: Price (Low to High)</option>
                    <option>Sort by: Price (High to Low)</option>
                    <option>Sort by: Most Popular</option>
                  </select>
                </div>
                
                {isLoadingBeats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Skeleton key={i} className="h-[280px] rounded-lg" />
                    ))}
                  </div>
                ) : beats && beats.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {beats.map((beat) => (
                      <BeatCard key={beat.id} beat={beat} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Store className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-medium">No beats yet</h3>
                    <p className="text-muted-foreground mb-6">
                      This producer hasn't published any beats yet
                    </p>
                  </div>
                )}
              </TabsContent>
              
              {/* Popular Tab */}
              <TabsContent value="popular">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {!isLoadingBeats && beats && beats.length > 0 ? 
                    beats
                      .sort((a, b) => (b.favorites_count || 0) - (a.favorites_count || 0))
                      .slice(0, 8)
                      .map((beat) => (
                        <BeatCard key={beat.id} beat={beat} />
                      ))
                    :
                    <div className="col-span-full text-center py-10">
                      <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No popular beats yet</h3>
                      <p className="text-muted-foreground">
                        Come back later to see this producer's most popular tracks
                      </p>
                    </div>
                  }
                </div>
              </TabsContent>
              
              {/* About Tab */}
              <TabsContent value="about">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-card/60">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <BarChart4 size={18} className="text-purple-500" />
                        Producer Info
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Name</span>
                          <span className="font-medium">{producer.stage_name || producer.full_name}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Location</span>
                          <span className="font-medium">{producer.country || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Member Since</span>
                          <span className="font-medium">{formatJoinDate(producer.created_at)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Followers</span>
                          <span className="font-medium">{followerCount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-border/40">
                          <span className="text-sm text-muted-foreground">Beat Count</span>
                          <span className="font-medium">{beats?.length || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/60">
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Music size={18} className="text-purple-500" />
                        Music Style
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Bio</h4>
                          <p className="text-sm text-muted-foreground">{producer.bio || 'No bio provided'}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-2">Genres</h4>
                          <div className="flex flex-wrap gap-2">
                            {beats && beats.length > 0 ? (
                              [...new Set(beats.map(beat => beat.genre).filter(Boolean))]
                                .map((genre, index) => (
                                  <Badge key={index} variant="secondary" className="px-3 py-1 text-xs">
                                    {genre}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No genres available
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Producer Not Found</h1>
            <p className="text-muted-foreground mb-4">The producer you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
