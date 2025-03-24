
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";
import { BeatCard } from "@/components/ui/BeatCard";
import { 
  MapPin, 
  Calendar, 
  Music, 
  Share2, 
  Heart, 
  MessageSquare, 
  BarChart4,
  Disc
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ProducerProfile() {
  const { producerId } = useParams<{ producerId: string }>();
  const { beats, isLoading: isLoadingBeats } = useBeats();
  const { playBeat } = usePlayer();
  const [producer, setProducer] = useState<Partial<User> | null>(null);
  const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = producer?.producer_name 
      ? `${producer.producer_name} | Creacove` 
      : "Producer Profile | Creacove";
  }, [producer]);

  useEffect(() => {
    const fetchProducer = async () => {
      if (!producerId) return;

      setIsLoading(true);
      try {
        // Get producer details
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, stage_name, bio, profile_picture, country')
          .eq('id', producerId)
          .eq('role', 'producer')
          .single();

        if (error) throw error;

        setProducer({
          id: data.id,
          name: data.full_name,
          producer_name: data.stage_name,
          bio: data.bio,
          avatar_url: data.profile_picture,
          country: data.country
        });
      } catch (error) {
        console.error('Error fetching producer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducer();
  }, [producerId]);

  useEffect(() => {
    // Filter beats by this producer once we have both the producer and all beats
    if (producerId && beats.length > 0) {
      const filteredBeats = beats.filter(beat => beat.producer_id === producerId);
      setProducerBeats(filteredBeats);
    }
  }, [producerId, beats]);

  const genreCount = () => {
    const genres = producerBeats.map(beat => beat.genre);
    return new Set(genres).size;
  };

  return (
    <MainLayoutWithPlayer>
      <div className="container py-8">
        {isLoading ? (
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
                    <AvatarImage src={producer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.producer_name || producer.name}`} />
                    <AvatarFallback className="bg-primary/90 text-2xl">
                      {(producer.producer_name || producer.name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 md:mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {producer.producer_name || producer.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                        {producer.country && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin size={14} />
                            {producer.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm">
                          <Music size={14} />
                          {producerBeats.length} {producerBeats.length === 1 ? 'beat' : 'beats'}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Disc size={14} />
                          {genreCount()} {genreCount() === 1 ? 'genre' : 'genres'}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          Member since 2023
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" className="gap-1.5">
                        <Heart size={14} />
                        Follow
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1.5">
                        <Share2 size={14} />
                        Share
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1.5">
                        <MessageSquare size={14} />
                        Contact
                      </Button>
                    </div>
                  </div>
                  
                  {producer.bio ? (
                    <p className="text-sm md:text-base mb-4 max-w-3xl">{producer.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic mb-4 text-sm md:text-base">This producer hasn't added a bio yet.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Tabs defaultValue="beats" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="beats" className="gap-2">
                    <Music size={16} />
                    Beats
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-2">
                    <BarChart4 size={16} />
                    About
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="beats" className="py-4">
                  {isLoadingBeats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-64 w-full" />
                      ))}
                    </div>
                  ) : producerBeats.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {producerBeats.map(beat => (
                        <BeatCard 
                          key={beat.id} 
                          beat={beat} 
                          onPlay={() => playBeat(beat)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-secondary/40 rounded-xl">
                      <Music size={48} className="mx-auto mb-4 text-muted-foreground/60" />
                      <p className="text-muted-foreground mb-2">This producer hasn't uploaded any beats yet.</p>
                      <p className="text-xs text-muted-foreground/70">Check back later for new content</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="about">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <BarChart4 size={18} className="text-primary" />
                          Producer Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Beats</span>
                            <span className="font-medium">{producerBeats.length}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Genres</span>
                            <span className="font-medium">{genreCount()}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Average Price</span>
                            <span className="font-medium">
                              ${producerBeats.length > 0 
                                ? (producerBeats.reduce((acc, beat) => acc + beat.price, 0) / producerBeats.length).toFixed(2)
                                : '0.00'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Member Since</span>
                            <span className="font-medium">2023</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <Disc size={18} className="text-primary" />
                          Top Genres
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {producerBeats.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(producerBeats.map(beat => beat.genre))).map(genre => (
                              <Badge key={genre} variant="secondary" className="px-3 py-1 text-xs">
                                {genre}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No beats available to analyze genres</p>
                        )}
                        
                        <div className="mt-6">
                          <h3 className="text-sm font-medium mb-2">Bio</h3>
                          <p className="text-sm text-muted-foreground">{producer.bio || 'No bio provided'}</p>
                        </div>
                        
                        <div className="mt-4">
                          <h3 className="text-sm font-medium mb-2">Location</h3>
                          <p className="text-sm text-muted-foreground">{producer.country || 'Not specified'}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
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
