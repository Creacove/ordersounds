
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Music, Share2 } from 'lucide-react';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BeatCardCompact } from '@/components/marketplace/BeatCardCompact';
import { FollowButton } from '@/components/buttons/FollowButton';
import { FollowerCount } from '@/components/producer/profile/FollowerCount';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/utils/formatters';
import { Beat } from '@/types';
import { toast } from 'sonner';

interface ProducerProfileData {
  id: string;
  full_name: string;
  stage_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  country: string | null;
  follower_count: number;
  created_at: string;
}

export default function ProducerProfile() {
  const { producerId } = useParams<{ producerId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('beats');
  
  const { data: producer, isLoading: isLoadingProducer } = useQuery({
    queryKey: ['producer', producerId],
    queryFn: async () => {
      // Query for producer profile data
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          stage_name,
          bio,
          profile_picture as avatar_url,
          country,
          created_date as created_at,
          follower_count
        `)
        .eq('id', producerId)
        .eq('role', 'producer')
        .single();

      if (error) {
        console.error('Error fetching producer profile:', error);
        throw error;
      }
      
      // Make sure the profile includes a follower_count
      return {
        ...data,
        follower_count: data.follower_count || 0
      } as ProducerProfileData;
    },
    enabled: !!producerId,
  });

  const { data: beats = [], isLoading: isLoadingBeats } = useQuery({
    queryKey: ['producerBeats', producerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('beats')
        .select('*')
        .eq('producer_id', producerId)
        .eq('status', 'published')
        .order('upload_date', { ascending: false });

      if (error) {
        console.error('Error fetching producer beats:', error);
        throw error;
      }
      
      return data as Beat[];
    },
    enabled: !!producerId && activeTab === 'beats',
  });
  
  const isOwnProfile = user?.id === producerId;
  
  const handleShareClick = () => {
    // Get the current URL to share
    const shareUrl = window.location.href;
    
    // Use navigator.clipboard to copy the URL
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Producer URL copied to clipboard");
    }).catch(err => {
      console.error("Could not copy URL: ", err);
      toast.error("Could not copy URL");
    });
  };
  
  if (isLoadingProducer) {
    return <div className="container py-8">Loading producer profile...</div>;
  }

  if (!producer) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Producer Not Found</h1>
          <p className="mb-6">The producer you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/producers')}>View All Producers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="shrink-0">
          <Avatar className="w-24 h-24 md:w-32 md:h-32 border">
            <AvatarImage src={producer.avatar_url || undefined} alt={producer.stage_name || producer.full_name} />
            <AvatarFallback className="text-xl md:text-2xl">
              {getInitials(producer.stage_name || producer.full_name)}
            </AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">
              {producer.stage_name || producer.full_name}
            </h1>
            
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <span>•</span>
              <span>{producer.country || 'Unknown location'}</span>
            </div>
          </div>
          
          <div className="mb-4">
            <FollowerCount count={producer.follower_count} />
          </div>
          
          {producer.bio && (
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
              {producer.bio}
            </p>
          )}
          
          <div className="flex flex-wrap gap-3 mt-4">
            {!isOwnProfile && (
              <FollowButton 
                producerId={producer.id} 
                variant="default"
              />
            )}

            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleShareClick}
            >
              <Share2 size={16} />
              Share
            </Button>
            
            {isOwnProfile && (
              <Button 
                variant="outline"
                onClick={() => navigate('/producer/settings')}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="beats" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="beats">Beats</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
        
        <TabsContent value="beats" className="pt-6">
          <SectionTitle 
            title="All Beats" 
            icon={<Music className="size-5" />} 
          />
          
          {isLoadingBeats ? (
            <div>Loading beats...</div>
          ) : beats.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {beats.map((beat) => (
                <BeatCardCompact key={beat.id} beat={beat} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/40 rounded-lg">
              <h3 className="text-lg font-medium mb-2">No beats available</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                {isOwnProfile 
                  ? "You haven't uploaded any beats yet. Start sharing your music with the world!"
                  : "This producer hasn't uploaded any beats yet."}
              </p>
              
              {isOwnProfile && (
                <Button onClick={() => navigate('/producer/upload')}>
                  Upload Your First Beat
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="pt-6">
          <SectionTitle title="About" />
          
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-medium mb-2">Bio</h3>
              <p className="text-muted-foreground">
                {producer.bio || "No bio available"}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Location</h3>
              <p className="text-muted-foreground">
                {producer.country || "Not specified"}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Producer Since</h3>
              <p className="text-muted-foreground">
                {producer.created_at 
                  ? new Date(producer.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })
                  : "Unknown"}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
