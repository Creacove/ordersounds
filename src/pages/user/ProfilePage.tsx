
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { User, Playlist, Beat } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { PlaylistCard } from "@/components/library/PlaylistCard";
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
  FileEdit,
  Music
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BeatCard } from "@/components/ui/BeatCard";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [isLoadingBeats, setIsLoadingBeats] = useState(false);
  const isOwnProfile = currentUser?.id === userId;
  const isProducerProfile = profileUser?.role === "producer";

  useEffect(() => {
    document.title = profileUser?.name 
      ? `${profileUser.name} | OrderSOUNDS` 
      : "User Profile | OrderSOUNDS";
  }, [profileUser]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        // Get user details
        const { data, error } = await supabase
          .from('users')
          .select('id, name, bio, avatar_url, country, role, producer_name, created_at')
          .eq('id', userId)
          .single();

        if (error) throw error;

        setProfileUser({
          id: data.id,
          name: data.name || data.producer_name,
          bio: data.bio,
          avatar_url: data.avatar_url,
          country: data.country,
          role: data.role,
          producer_name: data.producer_name,
          created_at: data.created_at
        });

        // If this is the user's own profile or if we're looking at public playlists,
        // fetch their playlists and/or beats
        if (isOwnProfile || currentUser) {
          fetchUserContent(data.role);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, currentUser, isOwnProfile]);

  const fetchUserContent = async (userRole: string) => {
    if (!userId) return;

    if (userRole === "buyer" || userRole === "producer") {
      fetchUserPlaylists();
    }
    
    if (userRole === "producer") {
      fetchProducerBeats();
    }
  };

  const fetchUserPlaylists = async () => {
    if (!userId) return;

    setIsLoadingPlaylists(true);
    try {
      if (isOwnProfile) {
        // Get all playlists if it's the user's own profile
        const userPlaylists = await getUserPlaylists(userId);
        setPlaylists(userPlaylists);
      } else {
        // Only get public playlists for other users
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('owner_id', userId)
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

  const fetchProducerBeats = async () => {
    if (!userId) return;

    setIsLoadingBeats(true);
    try {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBeats(data as unknown as Beat[]);
    } catch (error) {
      console.error('Error fetching beats:', error);
    } finally {
      setIsLoadingBeats(false);
    }
  };

  const handlePlaylistClick = (id: string) => {
    navigate(`/playlists/${id}`);
  };

  const handleBeatClick = (id: string) => {
    navigate(`/beat/${id}`);
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
        ) : profileUser ? (
          <>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/20 to-background h-40 rounded-xl -z-10"></div>
              <div className="flex flex-col md:flex-row gap-6 pt-6 mb-8">
                <div className="flex-shrink-0 md:ml-8">
                  <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={profileUser.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${profileUser.name}`} />
                    <AvatarFallback className="bg-blue-500 text-2xl">
                      {(profileUser.name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1 md:mt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {isProducerProfile ? profileUser.producer_name || profileUser.name : profileUser.name}
                        {isProducerProfile && (
                          <Badge variant="outline" className="ml-2 text-xs font-normal">
                            Producer
                          </Badge>
                        )}
                      </h1>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground mb-4">
                        {profileUser.country && (
                          <span className="flex items-center gap-1 text-sm">
                            <MapPin size={14} />
                            {profileUser.country}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-sm">
                          {isProducerProfile ? (
                            <>
                              <Music size={14} />
                              {beats.length} {beats.length === 1 ? 'beat' : 'beats'}
                            </>
                          ) : (
                            <>
                              <ListMusic size={14} />
                              {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                            </>
                          )}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Calendar size={14} />
                          Member since {new Date(profileUser.created_at || Date.now()).getFullYear()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {isOwnProfile ? (
                        <Button asChild size="sm" variant="default" className="gap-1.5">
                          <a href="/settings">
                            <FileEdit size={14} />
                            Edit Profile
                          </a>
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <UserPlus size={14} />
                            Follow
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <Share2 size={14} />
                            Share
                          </Button>
                          <Button size="sm" variant="secondary" className="gap-1.5">
                            <MessageSquare size={14} />
                            Message
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {profileUser.bio ? (
                    <p className="text-sm md:text-base mb-4 max-w-3xl">{profileUser.bio}</p>
                  ) : (
                    <p className="text-muted-foreground italic mb-4 text-sm md:text-base">
                      {isOwnProfile ? "You haven't added a bio yet." : "This user hasn't added a bio yet."}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <Tabs defaultValue={isProducerProfile ? "beats" : "playlists"} className="w-full">
                <TabsList className="mb-4">
                  {isProducerProfile && (
                    <TabsTrigger value="beats" className="gap-2">
                      <Music size={16} />
                      Beats
                    </TabsTrigger>
                  )}
                  <TabsTrigger value="playlists" className="gap-2">
                    <ListMusic size={16} />
                    Playlists
                  </TabsTrigger>
                  <TabsTrigger value="about" className="gap-2">
                    <BarChart4 size={16} />
                    About
                  </TabsTrigger>
                </TabsList>
                
                {isProducerProfile && (
                  <TabsContent value="beats" className="py-4">
                    {isLoadingBeats ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map(i => (
                          <Skeleton key={i} className="h-64 w-full" />
                        ))}
                      </div>
                    ) : beats.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {beats.map(beat => (
                          <BeatCard 
                            key={beat.id} 
                            beat={beat} 
                            onClick={() => handleBeatClick(beat.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyState
                        icon={Music}
                        title={isOwnProfile ? "You haven't uploaded any beats yet" : "No beats to show"}
                        description={isOwnProfile 
                          ? "Upload your first beat to start selling" 
                          : "This producer hasn't uploaded any beats yet"
                        }
                        actionLabel={isOwnProfile ? "Upload Beat" : undefined}
                        actionHref={isOwnProfile ? "/producer/upload" : undefined}
                      />
                    )}
                  </TabsContent>
                )}
                
                <TabsContent value="playlists" className="py-4">
                  {isLoadingPlaylists ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-64 w-full" />
                      ))}
                    </div>
                  ) : playlists.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {playlists.map(playlist => (
                        <PlaylistCard 
                          key={playlist.id} 
                          playlist={playlist} 
                          onClick={() => handlePlaylistClick(playlist.id)}
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
                      actionHref={isOwnProfile ? "/playlists" : undefined}
                    />
                  )}
                </TabsContent>
                
                <TabsContent value="about">
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <BarChart4 size={18} className="text-blue-500" />
                          User Info
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">
                              {isProducerProfile ? "Producer Name" : "Full Name"}
                            </span>
                            <span className="font-medium">
                              {isProducerProfile ? profileUser.producer_name || profileUser.name : profileUser.name}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Location</span>
                            <span className="font-medium">{profileUser.country || 'Not specified'}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">Member Since</span>
                            <span className="font-medium">
                              {new Date(profileUser.created_at || Date.now()).getFullYear()}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-border/40">
                            <span className="text-sm text-muted-foreground">
                              {isProducerProfile ? "Beats" : "Playlists"}
                            </span>
                            <span className="font-medium">
                              {isProducerProfile ? beats.length : playlists.length}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-card/60">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          {isProducerProfile ? (
                            <>
                              <Music size={18} className="text-blue-500" />
                              Production
                            </>
                          ) : (
                            <>
                              <ListMusic size={18} className="text-blue-500" />
                              Music Interests
                            </>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium mb-2">Bio</h3>
                            <p className="text-sm text-muted-foreground">{profileUser.bio || 'No bio provided'}</p>
                          </div>
                          
                          <div>
                            <h3 className="text-sm font-medium mb-2">
                              {isProducerProfile ? "Genres" : "Interests"}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="px-3 py-1 text-xs">
                                {isProducerProfile ? "Producer" : "Music Fan"}
                              </Badge>
                              {isOwnProfile && (
                                <span className="text-xs text-muted-foreground mt-2">
                                  Add your {isProducerProfile ? "genres" : "music interests"} in your profile settings
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
            <Button asChild>
              <a href="/">Back to Home</a>
            </Button>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
