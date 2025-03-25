
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useBeats } from "@/hooks/useBeats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Producer {
  id: string;
  name: string;
  profile_picture?: string;
  beatCount: number;
}

export default function Producers() {
  const { beats, isLoading } = useBeats();
  const [producers, setProducers] = useState<Producer[]>([]);
  const [isLoadingProducers, setIsLoadingProducers] = useState(true);
  
  useEffect(() => {
    document.title = "Producers | Creacove";
  }, []);

  useEffect(() => {
    // Fetch producers directly from users table
    const fetchProducers = async () => {
      setIsLoadingProducers(true);
      try {
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, profile_picture')
          .eq('role', 'producer');

        if (error) throw error;

        // Map the data to our Producer interface
        const producersWithCounts = producersData.map(producer => ({
          id: producer.id,
          name: producer.stage_name || producer.full_name || 'Unknown Producer',
          profile_picture: producer.profile_picture,
          beatCount: beats.filter(beat => beat.producer_id === producer.id).length
        }));
        
        // Sort by beat count
        const sortedProducers = producersWithCounts.sort((a, b) => b.beatCount - a.beatCount);
        setProducers(sortedProducers);
      } catch (error) {
        console.error("Error fetching producers:", error);
        toast.error("Failed to load producers");
      } finally {
        setIsLoadingProducers(false);
      }
    };

    if (!isLoading) {
      fetchProducers();
    }
  }, [beats, isLoading]);

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Browse Producers</h1>
        
        {isLoadingProducers ? (
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
                    <AvatarImage 
                      src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.name}`} 
                      alt={producer.name} 
                    />
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
