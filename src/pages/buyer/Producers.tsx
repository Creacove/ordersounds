
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
import { Separator } from "@/components/ui/separator";

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
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .order('follower_count', { ascending: false });

        if (error) throw error;

        if (!producersData) return []; // Ensure we have producer data before proceeding

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
        <div className="flex flex-col items-center min-h-screen p-4 md:p-8 bg-black text-white">
          <div className="w-full max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Discover Producers</h1>
            
            <div className="mb-10">
              <h2 className="text-2xl font-semibold mb-6">Suggested for you</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-64 w-full rounded-xl bg-gray-800" />
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">All Producers</h2>
                <Skeleton className="h-10 w-40 rounded-full bg-gray-800" />
              </div>
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl bg-gray-800" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col min-h-screen p-4 md:p-8 bg-black text-white">
        <div className="w-full max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Discover Producers</h1>
          
          {/* Suggested Producers Section - Desktop */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Suggested for you</h2>
              <Button 
                variant="outline" 
                className="bg-[#121212] hover:bg-[#1a1a1a] text-white border-none rounded-full px-4"
                onClick={handleShuffleSuggestions}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Shuffle Suggestions
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-4">
              {producers && producers.slice(0, 8).map((producer) => (
                <div 
                  key={producer.id} 
                  className="relative bg-[#121212] rounded-xl p-4 transition-all duration-200 hover:bg-[#1a1a1a] group"
                >
                  <button 
                    className="absolute top-3 right-3 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" 
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
                    <Avatar className="h-20 w-20 mx-auto mb-4 rounded-full overflow-hidden">
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
                    </div>
                  </Link>
                  
                  <div className="text-xs text-gray-400 mb-4 text-center">
                    <FollowerCount 
                      count={producer.follower_count || 0} 
                      className="text-xs text-gray-400"
                    />
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()} className="w-full">
                    <FollowButton 
                      producerId={producer.id}
                      className="w-full bg-[#323232] hover:bg-[#3c3c3c] text-white" 
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Separator className="bg-gray-800 my-8" />
          
          {/* All Producers Section */}
          <div className="mb-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Browse Producers</h2>
              <div className="flex bg-[#121212] rounded-full overflow-hidden">
                <Button 
                  variant={!showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(false)}
                  className="rounded-l-full rounded-r-none"
                >
                  All Producers
                </Button>
                <Button 
                  variant={showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(true)}
                  className="rounded-r-full rounded-l-none"
                >
                  Following
                </Button>
              </div>
            </div>
            
            {/* List of all producers - Desktop friendly */}
            <div className="space-y-3">
              {producers && producers.map((producer) => (
                <Link 
                  to={`/producer/${producer.id}`}
                  key={producer.id} 
                  className="flex items-center p-4 bg-[#121212] rounded-xl hover:bg-[#1a1a1a] transition-colors"
                >
                  <Avatar className="h-16 w-16 mr-4">
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
                      <h3 className="font-medium text-lg text-white truncate">
                        {producer.stage_name || producer.full_name}
                      </h3>
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
                      </span>
                      <span>•</span>
                      <FollowerCount 
                        count={producer.follower_count || 0} 
                        className="text-sm text-gray-400"
                      />
                    </div>
                    {producer.bio && (
                      <p className="text-gray-400 text-sm mt-1 line-clamp-1">{producer.bio}</p>
                    )}
                  </div>
                  
                  <div onClick={(e) => e.stopPropagation()} className="ml-4">
                    <FollowButton 
                      producerId={producer.id}
                      size="default"
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
