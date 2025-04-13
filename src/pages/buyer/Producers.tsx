import { useEffect, useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { FollowButton } from "@/components/buttons/FollowButton";
import { FollowerCount } from "@/components/producer/profile/FollowerCount";
import { Music, RefreshCw, Search, Smartphone, Tablet, Monitor, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useProducers, Producer } from "@/hooks/useProducers";

export default function Producers() {
  const [showingFollowed, setShowingFollowed] = useState(false);
  const [suggestedProducers, setSuggestedProducers] = useState<Producer[]>([]);
  const [dismissedProducerIds, setDismissedProducerIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { producers, isLoading, refetch } = useProducers();
  
  useEffect(() => {
    document.title = "Producers | OrderSOUNDS";
  }, []);

  // Get only followed producers with improved caching
  const { data: followedProducers, isLoading: followedLoading } = useQuery({
    queryKey: ['followedProducers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      try {
        // Get producers that the user follows
        const { data: follows, error: followsError } = await supabase
          .from('followers')
          .select('followee_id')
          .eq('follower_id', user.id);
          
        if (followsError || !follows.length) return [];
        
        const followeeIds = follows.map(follow => follow.followee_id);
        
        // Filter the already loaded producers by followee IDs
        if (producers && producers.length > 0) {
          return producers.filter(producer => followeeIds.includes(producer.id));
        }
        
        // If producers aren't loaded yet, fetch them directly
        const { data: producersData, error } = await supabase
          .from('users')
          .select('id, stage_name, full_name, bio, profile_picture, follower_count')
          .eq('role', 'producer')
          .in('id', followeeIds);
          
        if (error) throw error;
        if (!producersData) return [];
        
        // Get beat counts in parallel
        const producersWithBeats = await Promise.all(
          producersData.map(async (producer) => {
            const { count, error: beatError } = await supabase
              .from('beats')
              .select('id', { count: 'exact', head: true })
              .eq('producer_id', producer.id);

            if (beatError) {
              console.error('Error getting beat count:', beatError);
              return { 
                ...producer, 
                beatCount: 0,
                name: producer.stage_name || producer.full_name,
                avatar: producer.profile_picture || `/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png`,
                verified: true
              };
            }

            return { 
              ...producer, 
              beatCount: count || 0,
              name: producer.stage_name || producer.full_name,
              avatar: producer.profile_picture || `/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png`,
              verified: true
            };
          })
        );
        
        return producersWithBeats;
      } catch (error) {
        console.error("Error fetching followed producers:", error);
        return [];
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000 // Keep data fresh for 5 minutes
  });

  // Generate suggested producers
  const getSuggestedProducers = useCallback(() => {
    if (!producers || producers.length === 0) return [];
    
    // Create a copy of producers excluding dismissed ones
    const availableProducers = producers.filter(
      producer => !dismissedProducerIds.has(producer.id)
    );
    
    // Shuffle the array
    const shuffled = [...availableProducers].sort(() => 0.5 - Math.random());
    
    // Return up to 8 random producers
    return shuffled.slice(0, 8);
  }, [producers, dismissedProducerIds]);
  
  // Initialize suggested producers
  useEffect(() => {
    if (producers && producers.length > 0) {
      setSuggestedProducers(getSuggestedProducers());
    }
  }, [producers, getSuggestedProducers]);

  const handleShuffleSuggestions = () => {
    if (producers && producers.length > 0) {
      setSuggestedProducers(getSuggestedProducers());
      toast.success("Shuffled suggestions");
    }
  };
  
  const handleDismissProducer = (producerId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add producer ID to dismissed set
    setDismissedProducerIds(prev => new Set([...prev, producerId]));
    
    // Remove from current suggestions
    setSuggestedProducers(current => 
      current.filter(producer => producer.id !== producerId)
    );
    
    toast.success("Producer removed from suggestions");
  };

  // Filter producers based on search query
  const filterProducers = (producerList: Producer[] | undefined) => {
    if (!producerList) return [];
    if (!searchQuery.trim()) return producerList;
    
    return producerList.filter(producer => {
      const stageName = (producer.stage_name || '').toLowerCase();
      const fullName = (producer.full_name || '').toLowerCase();
      const bio = (producer.bio || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      
      return stageName.includes(query) || fullName.includes(query) || bio.includes(query);
    });
  };

  // Show improved loading state
  if (isLoading) {
    return (
      <MainLayout>
        <div className="page-container bg-background text-foreground">
          <div className="w-full max-w-7xl mx-auto">
            <SectionTitle title="Discover Producers" className="header-spacing" />
            
            <div className="w-full flex items-center justify-center mb-6">
              <div className="relative w-full max-w-md">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
            
            <div className="mb-10">
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-8 w-40" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-secondary rounded-lg p-4 flex flex-col items-center">
                    <Skeleton className="h-16 w-16 rounded-full mb-3" />
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16 mb-3" />
                    <Skeleton className="h-8 w-full rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            
            <Skeleton className="h-1 w-full mb-8" />
            
            <div>
              <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-10 w-40 rounded-full" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Determine which producers to show based on current view and search
  const filteredProducers = showingFollowed 
    ? filterProducers(followedProducers || []) 
    : filterProducers(producers || []);
  
  const isEmptyState = showingFollowed && (!followedProducers || followedProducers.length === 0);
  const isEmptySearch = filteredProducers.length === 0 && searchQuery.trim() !== '';

  // Responsive layout indicators
  const getDeviceIndicator = () => {
    return (
      <div className="hidden md:flex items-center gap-2 text-gray-500 text-sm">
        <Monitor className="h-4 w-4 md:hidden lg:block" />
        <Tablet className="h-4 w-4 hidden md:block lg:hidden" />
        <Smartphone className="h-4 w-4 sm:hidden" />
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="page-container bg-background text-foreground">
        <div className="w-full max-w-7xl mx-auto">
          <SectionTitle 
            title="Discover Producers" 
            className="header-spacing"
          />

          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search producers by name or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2 bg-secondary text-foreground border-border focus:ring-2 focus:ring-ring w-full rounded-md"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Suggested Producers Section */}
          {suggestedProducers.length > 0 && !searchQuery && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <h2 className="heading-responsive-md">Suggested for you</h2>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShuffleSuggestions}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  <span className="whitespace-nowrap">Shuffle Suggestions</span>
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {suggestedProducers.map((producer) => (
                  <div 
                    key={producer.id} 
                    className="bg-secondary rounded-lg p-4 relative group"
                  >
                    <button 
                      className="absolute top-2 right-2 bg-background/50 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10" 
                      aria-label="Dismiss"
                      onClick={(e) => handleDismissProducer(producer.id, e)}
                    >
                      <X size={16} />
                    </button>
                    
                    <Link to={`/producer/${producer.id}`} className="flex flex-col items-center">
                      <Avatar className="h-16 w-16 mb-3">
                        <AvatarImage 
                          src={producer.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.name}`}
                          alt={producer.name} 
                        />
                        <AvatarFallback>
                          {(producer.name || 'P').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <h3 className="text-responsive-base font-semibold mb-1 text-center truncate max-w-full">
                        {producer.name}
                      </h3>
                      
                      <div className="text-muted-foreground text-xs mb-3">
                        <FollowerCount 
                          count={producer.follower_count || 0} 
                          className="text-xs text-muted-foreground"
                        />
                      </div>
                      
                      <FollowButton 
                        producerId={producer.id}
                        className="w-full"
                        size="sm"
                        variant="outline"
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <Separator className="my-8" />
          
          {/* All Producers Section */}
          <div className="mb-20">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
              <h2 className="heading-responsive-md">Browse Producers</h2>
              
              <div className="flex bg-secondary rounded-full p-1">
                <Button 
                  variant={!showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(false)}
                  size="sm"
                  className="rounded-l-full rounded-r-none"
                >
                  All Producers
                </Button>
                <Button 
                  variant={showingFollowed ? "default" : "ghost"} 
                  onClick={() => setShowingFollowed(true)}
                  size="sm"
                  className="rounded-r-full rounded-l-none"
                  disabled={!user}
                >
                  Following
                </Button>
              </div>
            </div>
            
            {/* Empty state for following tab when not logged in or no follows */}
            {isEmptyState ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
                <div className="text-center max-w-md px-4">
                  <h3 className="text-xl font-semibold mb-2">
                    {user ? "You're not following any producers yet" : "Sign in to see producers you follow"}
                  </h3>
                  <p className="text-gray-400 mb-6">
                    {user 
                      ? "Discover producers and follow them to stay updated with new beats"
                      : "Create an account or sign in to follow your favorite producers"
                    }
                  </p>
                  <Button 
                    onClick={() => setShowingFollowed(false)} 
                    className="bg-purple-700 hover:bg-purple-800"
                  >
                    {user ? "Browse Producers" : "View All Producers"}
                  </Button>
                </div>
              </div>
            ) : isEmptySearch ? (
              <div className="flex flex-col items-center justify-center py-16 bg-[#121212] rounded-xl">
                <div className="text-center max-w-md px-4">
                  <h3 className="text-xl font-semibold mb-2">No producers found</h3>
                  <p className="text-gray-400 mb-6">
                    No producers match your search for "{searchQuery}"
                  </p>
                  <Button 
                    onClick={() => setSearchQuery('')} 
                    className="bg-purple-700 hover:bg-purple-800"
                  >
                    Clear Search
                  </Button>
                </div>
              </div>
            ) : followedLoading && showingFollowed ? (
              // Loading state specifically for followed producers
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducers.map((producer) => (
                  <Link 
                    to={`/producer/${producer.id}`}
                    key={producer.id} 
                    className="flex items-center p-4 bg-[#121212] rounded-xl hover:bg-[#1a1a1a] transition-colors"
                  >
                    <Avatar className="h-14 w-14 sm:h-16 sm:w-16 mr-4">
                      <AvatarImage 
                        src={producer.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${producer.name}`}
                        alt={producer.name} 
                      />
                      <AvatarFallback>
                        {(producer.name || 'P').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <h3 className="font-medium text-base sm:text-lg text-white truncate">
                          {producer.name}
                        </h3>
                        {searchQuery && (producer.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                        producer.name?.toLowerCase().includes(searchQuery.toLowerCase())) && (
                          <Badge variant="secondary" className="ml-2 bg-purple-700/30 text-purple-300 text-xs">Match</Badge>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-400 flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                        <span className="flex items-center gap-1">
                          <Music className="h-3 w-3" />
                          {producer.beatCount} {producer.beatCount === 1 ? 'beat' : 'beats'}
                        </span>
                        <span className="hidden xs:inline-block">•</span>
                        <FollowerCount 
                          count={producer.follower_count || 0} 
                          className="text-xs sm:text-sm text-gray-400"
                        />
                      </div>
                      {producer.bio && (
                        <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-1">{producer.bio}</p>
                      )}
                    </div>
                    
                    <div onClick={(e) => e.stopPropagation()} className="ml-2 sm:ml-4">
                      <FollowButton 
                        producerId={producer.id}
                        size={isMobile ? "sm" : "default"}
                        variant="outline"
                        className="bg-transparent hover:bg-[#323232] text-sm data-[following=true]:bg-purple-700 data-[following=true]:hover:bg-purple-800 border-gray-700"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
