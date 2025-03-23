
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Producer {
  id: string;
  name: string;
  beatCount: number;
}

export default function Producers() {
  const { beats, isLoading } = useBeats();
  const [producers, setProducers] = useState<Producer[]>([]);
  
  useEffect(() => {
    document.title = "Producers | Creacove";
  }, []);

  useEffect(() => {
    if (!isLoading && beats.length > 0) {
      // Group beats by producer and count
      const producerMap = new Map<string, { id: string; name: string; beatCount: number }>();
      
      beats.forEach(beat => {
        if (!producerMap.has(beat.producer_id)) {
          producerMap.set(beat.producer_id, {
            id: beat.producer_id,
            name: beat.producer_name,
            beatCount: 1
          });
        } else {
          const producer = producerMap.get(beat.producer_id)!;
          producer.beatCount += 1;
          producerMap.set(beat.producer_id, producer);
        }
      });
      
      // Convert map to array and sort by beat count
      const producerArray = Array.from(producerMap.values())
        .sort((a, b) => b.beatCount - a.beatCount);
      
      setProducers(producerArray);
    }
  }, [beats, isLoading]);

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Producers</h1>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {producers.map((producer) => (
              <Card key={producer.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${producer.name}`} alt={producer.name} />
                    <AvatarFallback>{producer.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{producer.name}</h3>
                    <p className="text-sm text-muted-foreground">{producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="link" className="text-sm text-purple-500 hover:underline p-0">
                    <Link to={`/producer/${producer.id}`}>View profile</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
