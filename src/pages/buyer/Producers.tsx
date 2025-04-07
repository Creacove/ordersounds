
import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Music } from "lucide-react";

interface Producer {
  id: string;
  stage_name: string | null;
  full_name: string;
  bio: string | null;
  profile_picture: string | null;
  follower_count: number;
  beatCount: number;
}

export default function Producers() {
  useEffect(() => {
    document.title = "Producers | OrderSOUNDS";
  }, []);

  // Fetch producers
  const { data: producers, isLoading } = useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      try {
        // First, get all producers from the users table
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer');

        if (error) throw error;

        // For each producer, get their beat count
        const producersWithBeats = await Promise.all(
          producersData.map(async (producer) => {
            const { count, error: beatError } = await supabase
              .from('beats')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', producer.id);

            if (beatError) {
              console.error('Error getting beat count:', beatError);
              return { ...producer, beatCount: 0 };
            }

            return { 
              ...producer, 
              beatCount: count || 0
            };
          })
        );
        
        // Sort by follower count (most popular first)
        return producersWithBeats.sort((a, b) => (b.follower_count || 0) - (a.follower_count || 0));
      } catch (error) {
        console.error("Error fetching producers:", error);
        toast.error("Failed to load producers");
        return [];
      }
    }
  });

  const handleFollowChange = (producerId: string, isFollowing: boolean) => {
    // This is just for optimistic UI updates in the list
    // The actual count is updated via the invalidateQueries in the useFollows hook
    console.log(`Producer ${producerId} is now ${isFollowing ? 'followed' : 'unfollowed'}`);
  };

  return (
    <MainLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-2">Browse Producers</h1>
        <p className="text-muted-foreground mb-8">
          Discover talented producers and follow them to stay updated on their latest beats
        </p>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {producers && producers.map((producer) => (
              <Card key={producer.id} className="hover:shadow-md transition-shadow overflow-hidden">
                <Link 
                  to={`/producer/${producer.id}`} 
                  className="block cursor-pointer h-full"
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`} 
                        alt={producer.stage_name || producer.full_name} 
                      />
                      <AvatarFallback>
                        {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{producer.stage_name || producer.full_name}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
                        </span>
                        <span>&bull;</span>
                        <FollowerCount 
                          count={producer.follower_count || 0} 
                          className="text-xs"
                        />
                      </div>
                    </div>
                  </CardHeader>
                </Link>
                <CardContent className="pt-0">
                  {producer.bio && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {producer.bio}
                    </p>
                  )}
                  
                  <div onClick={(e) => e.stopPropagation()} className="mt-2">
                    <FollowButton 
                      producerId={producer.id} 
                      size="sm"
                      className="w-full"
                      onFollowChange={(isFollowing) => handleFollowChange(producer.id, isFollowing)} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
