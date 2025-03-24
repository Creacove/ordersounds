import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MainLayout } from "@/components/layout/MainLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BeatCard } from "@/components/ui/BeatCard";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, ShoppingCart, Heart, ArrowRight, UserCheck, Copy, Download, FileMusic, Edit, MoreVertical } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from '@/hooks/use-mobile';
import { PriceTag } from "@/components/ui/PriceTag";

interface ProducerProfileProps {
  // No props needed for now
}

const ProducerProfile: React.FC<ProducerProfileProps> = () => {
  const { producerId } = useParams<{ producerId: string }>();
  const { user } = useAuth();
  const { playBeat } = usePlayer();
  const { addToCart, isInCart: checkIsInCart } = useCart();
  const [producer, setProducer] = useState<any>(null);
  const [beats, setBeats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    stage_name: '',
    full_name: '',
    email: '',
    bio: '',
    website: '',
    twitter: '',
    instagram: '',
    youtube: '',
    profile_image_url: '',
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchProducerProfile = async () => {
      setIsLoading(true);
      try {
        // Fetch producer data
        const { data: producerData, error: producerError } = await supabase
          .from('users')
          .select('*')
          .eq('id', producerId)
          .single();

        if (producerError) {
          throw producerError;
        }

        if (producerData) {
          setProducer(producerData);
          setProfileData({
            stage_name: producerData.stage_name || '',
            full_name: producerData.full_name || '',
            email: producerData.email || '',
            bio: producerData.bio || '',
            website: producerData.website || '',
            twitter: producerData.twitter || '',
            instagram: producerData.instagram || '',
            youtube: producerData.youtube || '',
            profile_image_url: producerData.profile_image_url || '',
          });
        }

        // Fetch beats by producer
        const { data: beatsData, error: beatsError } = await supabase
          .from('beats')
          .select(`
            id,
            title,
            producer_id,
            users (
              full_name,
              stage_name
            ),
            cover_image,
            audio_preview,
            audio_file,
            price_local,
            price_diaspora,
            genre,
            track_type,
            bpm,
            tags,
            description,
            upload_date,
            favorites_count,
            purchase_count,
            status
          `)
          .eq('producer_id', producerId)
          .eq('status', 'published');

        if (beatsError) {
          throw beatsError;
        }

        if (beatsData) {
          const transformedBeats = beatsData.map(beat => {
            const userData = beat.users;
            const producerName = userData && userData.stage_name ? userData.stage_name : 
                                userData && userData.full_name ? userData.full_name : 'Unknown Producer';
            
            const status = beat.status === 'published' ? 'published' : 'draft';
            
            return {
              id: beat.id,
              title: beat.title,
              producer_id: beat.producer_id,
              producer_name: producerName,
              cover_image_url: beat.cover_image,
              preview_url: beat.audio_preview,
              full_track_url: beat.audio_file,
              price_local: beat.price_local,
              price_diaspora: beat.price_diaspora,
              genre: beat.genre,
              track_type: beat.track_type,
              bpm: beat.bpm,
              tags: beat.tags || [],
              description: beat.description,
              created_at: beat.upload_date,
              favorites_count: beat.favorites_count,
              purchase_count: beat.purchase_count,
              status: status,
              is_featured: false,
            };
          });
          setBeats(transformedBeats);
        }
      } catch (error) {
        console.error('Error fetching producer profile:', error);
        toast.error('Failed to load producer profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducerProfile();
  }, [producerId]);

  const handlePlayBeat = (beat: any) => {
    playBeat(beat);
  };

  const handleAddToCart = (beat: any) => {
    addToCart(beat);
    toast.success(`Added "${beat.title}" to cart`);
  };

  const isInCart = (beatId: string) => {
    return checkIsInCart ? checkIsInCart(beatId) : false;
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset profile data to the original values
    setProfileData({
      stage_name: producer?.stage_name || '',
      full_name: producer?.full_name || '',
      email: producer?.email || '',
      bio: producer?.bio || '',
      website: producer?.website || '',
      twitter: producer?.twitter || '',
      instagram: producer?.instagram || '',
      youtube: producer?.youtube || '',
      profile_image_url: producer?.profile_image_url || '',
    });
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          stage_name: profileData.stage_name,
          full_name: profileData.full_name,
          email: profileData.email,
          bio: profileData.bio,
          website: profileData.website,
          twitter: profileData.twitter,
          instagram: profileData.instagram,
          youtube: profileData.youtube,
          profile_image_url: profileData.profile_image_url,
        })
        .eq('id', producerId);

      if (error) {
        throw error;
      }

      // Update local state with new profile data
      setProducer({ ...producer, ...profileData });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">Loading producer profile...</h2>
        </div>
      </MainLayout>
    );
  }

  if (!producer) {
    return (
      <MainLayout>
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">Producer not found</h2>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        {/* Profile Header */}
        <div className="relative mb-8">
          <div className="h-48 bg-muted rounded-md overflow-hidden">
            {/* Cover Image */}
            <img
              src={producer.cover_image_url || '/placeholder-image.jpg'}
              alt="Producer Cover"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute left-4 bottom-[-60px] flex items-end gap-4">
            <Avatar className="h-32 w-32 border-2 border-white shadow-md">
              <AvatarImage src={producer.profile_image_url || '/placeholder-avatar.jpg'} alt={producer.stage_name} />
              <AvatarFallback>{producer.stage_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-white">{producer.stage_name}</h1>
              <div className="flex items-center gap-2 text-sm text-white/80">
                <UserCheck className="h-4 w-4" />
                Verified Producer
              </div>
            </div>
          </div>
        </div>

        {/* Profile Actions */}
        <div className="flex justify-end gap-2 mb-4">
          {user?.id === producerId && (
            <>
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={handleEditProfile}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="secondary" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Profile'}
                  </Button>
                </>
              )}
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Share Profile</DropdownMenuItem>
              <DropdownMenuItem>Report Producer</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Block Producer</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Details about this producer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="stage_name">Stage Name</Label>
                      <Input id="stage_name" name="stage_name" value={profileData.stage_name} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input id="full_name" name="full_name" value={profileData.full_name} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" name="email" type="email" value={profileData.email} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" name="bio" value={profileData.bio} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="website">Website</Label>
                      <Input id="website" name="website" value={profileData.website} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input id="twitter" name="twitter" value={profileData.twitter} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" name="instagram" value={profileData.instagram} onChange={handleChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input id="youtube" name="youtube" value={profileData.youtube} onChange={handleChange} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm">
                      <div className="font-medium">Stage Name</div>
                      <div>{producer.stage_name}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Full Name</div>
                      <div>{producer.full_name}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Email</div>
                      <div>{producer.email}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Bio</div>
                      <div>{producer.bio || 'No bio provided.'}</div>
                    </div>
                    {producer.website && (
                      <div className="text-sm">
                        <div className="font-medium">Website</div>
                        <div>
                          <a href={producer.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Visit Website
                          </a>
                        </div>
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="text-sm">
                      <div className="font-medium">Socials</div>
                      <div className="flex gap-4">
                        {producer.twitter && (
                          <a href={producer.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Twitter
                          </a>
                        )}
                        {producer.instagram && (
                          <a href={producer.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            Instagram
                          </a>
                        )}
                        {producer.youtube && (
                          <a href={producer.youtube} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            YouTube
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Beats Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Beats</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/producer/beats">
                  View All Beats
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {beats.map((beat) => (
                <div key={beat.id}>
                  <div
                    className={cn(
                      "group relative flex flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
                    )}
                  >
                    {/* Cover image with play button overlay */}
                    <div className="relative aspect-square overflow-hidden bg-secondary/20">
                      <img
                        src={beat.cover_image_url || '/placeholder.svg'}
                        alt={beat.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => handlePlayBeat(beat)}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110 shadow-md"
                          aria-label="Play"
                        >
                          <Play size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Beat info section - redesigned for better mobile visibility */}
                    <div className="flex flex-col p-3 space-y-2">
                      {/* Mobile-optimized layout with price tag under title and producer name */}
                      <div className="flex flex-col">
                        <h3 className="font-medium text-sm leading-tight tracking-tight truncate">
                          {beat.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate mb-1">
                          {beat.producer_name}
                        </p>
                        <PriceTag
                          localPrice={beat.price_local}
                          diasporaPrice={beat.price_diaspora}
                          size="sm"
                          className="self-start"
                        />
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 pt-1">
                        {!isInCart(beat.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleAddToCart(beat)}
                            className="h-7 w-7 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90"
                            title="Add to Cart"
                          >
                            <ShoppingCart size={14} />
                          </Button>
                        )}

                        {isInCart(beat.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md bg-primary/20 text-primary hover:bg-primary/30"
                            title="Go to Cart"
                          >
                            <ShoppingCart size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProducerProfile;
