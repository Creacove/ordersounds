
import { User, Playlist } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { EmptyState } from "@/components/library/EmptyState";
import { ListMusic, BarChart4 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileTabsProps {
  buyer: Partial<User>;
  playlists: Playlist[];
  isLoadingPlaylists: boolean;
  isOwnProfile: boolean;
}

export function ProfileTabs({ buyer, playlists, isLoadingPlaylists, isOwnProfile }: ProfileTabsProps) {
  return (
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
  );
}
