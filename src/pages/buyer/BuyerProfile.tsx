
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { User, Playlist } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { getUserPlaylists } from "@/lib/playlistService"; 
import { EmptyState } from "@/components/library/EmptyState";
import { 
  ListMusic, 
  MapPin, 
  Calendar, 
  Share2, 
  MessageSquare, 
  BarChart4,
  UserPlus,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BuyerProfile() {
  const { buyerId } = useParams<{ buyerId: string }>();
  const { user: currentUser } = useAuth();
  const [buyer, setBuyer] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const isOwnProfile = currentUser?.id === buyerId;
  const navigate = useNavigate();

  useEffect(() => {
    document.title = buyer?.name ? `${buyer.name} | OrderSOUNDS` : "User Profile | OrderSOUNDS";
  }, [buyer]);

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!buyerId) return;

      setIsLoading(true);
      try {
        // Get buyer details
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, bio, profile_picture, country, music_interests')
          .eq('id', buyerId)
          .single();

        if (error) throw error;

        setBuyer({
          id: data.id,
          name: data.full_name,
          bio: data.bio,
          avatar_url: data.profile_picture,
          country: data.country,
          music_interests: data.music_interests || []
        });

        // If this is the user's own profile or if we're looking at public playlists,
        // fetch their playlists
        if (isOwnProfile || currentUser) {
          fetchUserPlaylists();
        }
      } catch (error) {
        console.error('Error fetching buyer:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuyer();
  }, [buyerId, currentUser, isOwnProfile]);

  const fetchUserPlaylists = async () => {
    if (!buyerId) return;

    setIsLoadingPlaylists(true);
    try {
      if (isOwnProfile) {
        // Get all playlists if it's the user's own profile
        const userPlaylists = await getUserPlaylists(buyerId);
        setPlaylists(userPlaylists);
      } else {
        // Only get public playlists for other users
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('owner_id', buyerId)
          .eq('is_public', true);

        if (error) throw error;
        setPlaylists(data as unknown as Playlist[]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  const handleShareProfile = () => {
    if (navigator.share) {
      navigator.share({
        title: `${buyer?.name}'s profile on OrderSOUNDS`,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success('Profile link copied to clipboard!'))
        .catch(err => console.error('Error copying to clipboard:', err));
    }
  };

  return (
    <MainLayoutWithPlayer>
      <div className="container py-6 md:py-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>
        ) : buyer ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 to-background h-40 rounded-xl -z-10"></div>
              <div className="flex flex-col md:flex-row gap-6 pt-6 mb-8">
                <div className="flex-shrink-0 md:ml-6">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={buyer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${buyer.name}`} />
                    <AvatarFallback className="bg-purple-600 text-2xl">
                      {(buyer.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 md:mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold mb-1">
                        {buyer.name}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                        {buyer.country && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin size={14} />
                            {buyer.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm">
                          <ListMusic size={14} />
                          {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          Member since 2023
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button 
                          onClick={() => navigate("/settings")} 
                          size="sm" 
                          variant="default" 
                          className="gap-1.5 bg-purple-600 hover:bg-purple-700"
                        >
                          <Settings size={14} />
                          Edit Profile
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="default" className="gap-1.5 bg-purple-600 hover:bg-purple-700">
                            <UserPlus size={14} />
                            Follow
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleShareProfile}>
                            <Share2 size={14} />
                            Share
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            <MessageSquare size={14} />
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {buyer.bio ? (
                    <p className="text-sm md:text-base mb-4 max-w-3xl">{buyer.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic mb-4 text-sm md:text-base">
                      {isOwnProfile ? "You haven't added a bio yet. Add one in your profile settings." : "This user hasn't added a bio yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <Tabs defaultValue="playlists" className="w-full">
                <div className="border-b mb-6">
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="playlists" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      <ListMusic size={16} />
                      Playlists
                    </TabsTrigger>
                    <TabsTrigger value="about" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-purple-600 rounded-none">
                      <BarChart4 size={16} />
                      About
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="playlists" className="py-4">
                  {isLoadingPlaylists ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-64 w-full" />
                      ))}
                    </div>
                  ) : playlists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {playlists.map(playlist => (
                        <PlaylistCard 
                          key={playlist.id} 
                          playlist={playlist}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={ListMusic}
                      title={isOwnProfile ? "You don't have any playlists yet" : "No playlists to show"}
                      description={isOwnProfile 
                        ? "Create your first playlist to organize your favorite beats" 
                        : "This user hasn't created any public playlists yet"
                      }
                      actionLabel={isOwnProfile ? "Create Playlist" : undefined}
                      actionHref={isOwnProfile ? "/library" : undefined}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="about">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <BarChart4 size={18} className="text-purple-500" />
                          User Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Full Name</span>
                            <span className="font-medium">{buyer.name}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Location</span>
                            <span className="font-medium">{buyer.country || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Member Since</span>
                            <span className="font-medium">2023</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Playlists</span>
                            <span className="font-medium">{playlists.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <ListMusic size={18} className="text-purple-500" />
                          Music Interests & Bio
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Bio</h3>
                            <p className="text-sm text-muted-foreground">{buyer.bio || 'No bio provided'}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">Music Interests</h3>
                            <div className="flex flex-wrap gap-2">
                              {Array.isArray(buyer.music_interests) && buyer.music_interests.length > 0 ? (
                                buyer.music_interests.map((interest, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="px-3 py-1 text-xs bg-purple-100 text-purple-800 hover:bg-purple-200"
                                  >
                                    {interest}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-xs text-muted-foreground">No music interests added yet</span>
                              )}
                              
                              {isOwnProfile && (
                                <span className="text-xs text-muted-foreground mt-2 block">
                                  {Array.isArray(buyer.music_interests) && buyer.music_interests.length > 0 
                                    ? "Edit your music interests in your profile settings"
                                    : "Add your music interests in your profile settings"}
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
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground mb-4">The user you're looking for doesn't exist or has been removed.</p>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <a href="/">Back to Home</a>
            </Button>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
