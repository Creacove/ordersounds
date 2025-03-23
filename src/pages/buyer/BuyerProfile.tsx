
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { User, Playlist } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { getUserPlaylists } from "@/lib/playlistService"; 
import { EmptyState } from "@/components/library/EmptyState";
import { ListMusic } from "lucide-react";

export default function BuyerProfile() {
  const { buyerId } = useParams<{ buyerId: string }>();
  const { user: currentUser } = useAuth();
  const [buyer, setBuyer] = useState<Partial<User> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const isOwnProfile = currentUser?.id === buyerId;

  useEffect(() => {
    document.title = buyer?.name ? `${buyer.name} | Creacove` : "User Profile | Creacove";
  }, [buyer]);

  useEffect(() => {
    const fetchBuyer = async () => {
      if (!buyerId) return;

      setIsLoading(true);
      try {
        // Get buyer details
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, bio, profile_picture, country')
          .eq('id', buyerId)
          .single();

        if (error) throw error;

        setBuyer({
          id: data.id,
          name: data.full_name,
          bio: data.bio,
          avatar_url: data.profile_picture,
          country: data.country
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

  const handlePlaylistClick = (id: string) => {
    window.location.href = `/playlists?id=${id}`;
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
        ) : buyer ? (
          <>
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              <div className="flex-shrink-0">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={buyer.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${buyer.name}`} />
                  <AvatarFallback>{(buyer.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-1">
                  {buyer.name}
                </h1>
                <p className="text-muted-foreground mb-4">
                  {buyer.country || 'Music Fan'} • {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                </p>
                
                {buyer.bio ? (
                  <p className="mb-4">{buyer.bio}</p>
                ) : (
                  <p className="text-muted-foreground italic mb-4">
                    {isOwnProfile ? "You haven't added a bio yet." : "This user hasn't added a bio yet."}
                  </p>
                )}
                
                <div className="flex gap-2">
                  {isOwnProfile ? (
                    <Button asChild>
                      <a href="/settings">Edit Profile</a>
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" size="sm">Follow</Button>
                      <Button variant="outline" size="sm">Message</Button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <Tabs defaultValue="playlists" className="w-full">
              <TabsList>
                <TabsTrigger value="playlists">Playlists</TabsTrigger>
                <TabsTrigger value="about">About</TabsTrigger>
              </TabsList>
              
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
                        onClick={handlePlaylistClick}
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
                <Card>
                  <CardHeader>
                    <CardTitle>About {buyer.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium">Bio</h3>
                        <p className="mt-1">{buyer.bio || 'No bio provided'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Location</h3>
                        <p className="mt-1">{buyer.country || 'Not specified'}</p>
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
