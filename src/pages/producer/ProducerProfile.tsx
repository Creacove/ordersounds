
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
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={producer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.producer_name || producer.name}`} />
                  <AvatarFallback>{(producer.producer_name || producer.name || 'P').charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {producer.producer_name || producer.name}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {producer.country || 'Producer'} • {producerBeats.length} {producerBeats.length === 1 ? 'beat' : 'beats'}
                </p>
                
                {producer.bio ? (
                  <p className="mb-4">{producer.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic mb-4">This producer hasn't added a bio yet.</p>
                )}
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Follow</Button>
                  <Button variant="outline" size="sm">Share</Button>
                  <Button variant="outline" size="sm">Contact</Button>
                </div>
              </div>
            </div>

            <Tabs defaultValue="beats" className="w-full">
              <TabsList>
                <TabsTrigger value="beats">Beats</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
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
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">This producer hasn't uploaded any beats yet.</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>About {producer.producer_name || producer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">Bio</h3>
                        <p className="mt-1">{producer.bio || 'No bio provided'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Location</h3>
                        <p className="mt-1">{producer.country || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Member since</h3>
                        <p className="mt-1">2023</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
