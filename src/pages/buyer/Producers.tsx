
import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Music, RefreshCw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Producer {
  id: string;
  stage_name: string | null;
  full_name: string;
  bio: string | null;
  profile_picture: string | null;
  follower_count: number;
  beatCount: number;
  is_verified?: boolean;
}

export default function Producers() {
  const [showingFollowed, setShowingFollowed] = useState(false);
  
  useEffect(() => {
    document.title = "Producers | OrderSOUNDS";
  }, []);

  // Fetch producers
  const { data: producers, isLoading, refetch } = useQuery({
    queryKey: ['producers'],
    queryFn: async () => {
      try {
        // First, get all producers from the users table
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count, is_verified')
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });

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
        
        return producersWithBeats;
      } catch (error) {
        console.error("Error fetching producers:", error);
        toast.error("Failed to load producers");
        return [];
      }
    }
  });

  const handleShuffleSuggestions = () => {
    toast.success("Shuffled suggestions");
    refetch();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center min-h-screen pt-10 px-4 bg-black text-white">
          <div className="w-full max-w-lg">
            <h1 className="text-2xl font-bold text-center mb-8">Suggested for you</h1>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl bg-gray-800" />
              ))}
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col items-center min-h-screen pt-10 px-4 bg-black text-white">
        <div className="w-full max-w-lg">
          <h1 className="text-2xl font-bold text-center mb-8">Suggested for you</h1>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            {producers && producers.slice(0, 4).map((producer) => (
              <div 
                key={producer.id} 
                className="relative bg-[#121212] rounded-xl p-4 flex flex-col items-center"
              >
                <button 
                  className="absolute top-3 right-3 text-gray-400 hover:text-white" 
                  aria-label="Dismiss"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toast("Producer dismissed from suggestions", {
                      description: "You won't see this producer in suggestions again"
                    });
                  }}
                >
                  <X size={18} />
                </button>
                
                <Link to={`/producer/${producer.id}`} className="block text-center w-full">
                  <Avatar className="h-24 w-24 mx-auto mb-4 rounded-full overflow-hidden">
                    <AvatarImage 
                      src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                      alt={producer.stage_name || producer.full_name} 
                      className="object-cover"
                    />
                    <AvatarFallback className="text-lg">
                      {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <h3 className="font-bold text-lg truncate">
                      {producer.stage_name || producer.full_name}
                    </h3>
                    {producer.is_verified && (
                      <Badge variant="secondary" className="bg-blue-500 text-white h-5 py-0">
                        <span className="text-xs">✓</span>
                      </Badge>
                    )}
                  </div>
                </Link>
                
                <div className="text-xs text-gray-400 mb-4 text-center">
                  Followed by <span className="truncate">{/* Followers would go here */}</span>
                </div>
                
                <div onClick={(e) => e.stopPropagation()} className="w-full">
                  <FollowButton 
                    producerId={producer.id}
                    className="w-full bg-[#323232] hover:bg-[#3c3c3c] text-white" 
                  />
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full py-6 rounded-xl bg-[#121212] text-white border-none mb-12 hover:bg-[#1a1a1a]"
            onClick={handleShuffleSuggestions}
          >
            <RefreshCw className="mr-2 h-5 w-5" />
            Shuffle Suggestions
          </Button>
          
          <div className="mb-20">
            <div className="flex justify-between mb-4">
              <Button 
                variant={!showingFollowed ? "default" : "secondary"} 
                onClick={() => setShowingFollowed(false)}
                className="flex-1 rounded-l-full rounded-r-none"
              >
                All Producers
              </Button>
              <Button 
                variant={showingFollowed ? "default" : "secondary"} 
                onClick={() => setShowingFollowed(true)}
                className="flex-1 rounded-r-full rounded-l-none"
              >
                Following
              </Button>
            </div>
            
            {/* List of all producers */}
            <div className="space-y-3">
              {producers && producers.map((producer) => (
                <Link 
                  to={`/producer/${producer.id}`}
                  key={producer.id} 
                  className="flex items-center p-3 bg-[#121212] rounded-xl hover:bg-[#1a1a1a]"
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage 
                      src={producer.profile_picture || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.full_name}`}
                      alt={producer.stage_name || producer.full_name} 
                    />
                    <AvatarFallback>
                      {(producer.stage_name || producer.full_name || 'P').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <h3 className="font-medium text-white truncate">
                        {producer.stage_name || producer.full_name}
                      </h3>
                      {producer.is_verified && (
                        <Badge variant="secondary" className="ml-1 bg-blue-500 text-white h-5 py-0">
                          <span className="text-xs">✓</span>
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
                      </span>
                      <span>•</span>
                      <FollowerCount 
                        count={producer.follower_count || 0} 
                        className="text-xs text-gray-400"
                      />
                    </div>
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()} className="ml-4">
                    <FollowButton 
                      producerId={producer.id}
                      size="sm"
                      variant="outline"
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
