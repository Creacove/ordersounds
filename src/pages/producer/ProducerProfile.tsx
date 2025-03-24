
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
    social_links: {
      website: '',
      twitter: '',
      instagram: '',
      youtube: '',
    },
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
          // Check if social_links exists as an object, if not, initialize it
          const socialLinks = producerData.social_links || { website: '', twitter: '', instagram: '', youtube: '' };
          
          setProfileData({
            stage_name: producerData.stage_name || '',
            full_name: producerData.full_name || '',
            email: producerData.email || '',
            bio: producerData.bio || '',
            social_links: socialLinks,
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
    const socialLinks = producer?.social_links || { website: '', twitter: '', instagram: '', youtube: '' };
    
    setProfileData({
      stage_name: producer?.stage_name || '',
      full_name: producer?.full_name || '',
      email: producer?.email || '',
      bio: producer?.bio || '',
      social_links: socialLinks,
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
          social_links: profileData.social_links,
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

  const handleSocialLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prevData => ({
      ...prevData,
      social_links: {
        ...prevData.social_links,
        [name]: value
      }
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
      {/* Profile Header with gradient overlay */}
      <div className="relative bg-gradient-to-r from-purple-900 to-blue-900 text-white">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={producer.cover_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'}
            alt="Producer Cover"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        </div>
        
        <div className="container mx-auto relative z-10 px-4 py-12 md:py-20">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white/10 shadow-xl">
              <AvatarImage src={producer.profile_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'} alt={producer.stage_name} />
              <AvatarFallback className="bg-primary/20 text-primary text-xl">{producer.stage_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <div className="text-center md:text-left md:mb-2">
              <div className="flex flex-col md:flex-row items-center gap-2 mb-1">
                <h1 className="text-3xl md:text-4xl font-bold">{producer.stage_name}</h1>
                {producer.verified && (
                  <Badge className="bg-primary/70 text-white border-none">
                    <UserCheck className="mr-1 h-3 w-3" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-white/80">{producer.full_name}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4">
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <FileMusic className="h-4 w-4" />
                  <span>{beats.length} Beats</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <Download className="h-4 w-4" />
                  <span>124 Sales</span>
                </div>
                <div className="flex items-center gap-1 text-white/80 text-sm">
                  <Heart className="h-4 w-4" />
                  <span>43 Followers</span>
                </div>
              </div>
            </div>
            
            <div className="md:ml-auto flex gap-2">
              {user?.id === producerId ? (
                <>
                  {!isEditing ? (
                    <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleEditProfile}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" onClick={handleCancelEdit}>
                        Cancel
                      </Button>
                      <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveProfile} disabled={isLoading}>
                        {isLoading ? 'Saving...' : 'Save Profile'}
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button className="bg-primary hover:bg-primary/90">
                  <Heart className="h-4 w-4 mr-2" />
                  Follow
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
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
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="md:col-span-1">
            <Card className="overflow-hidden border-border/40 hover:border-border transition-all hover:shadow-md bg-gradient-to-br from-purple-50/5 to-transparent dark:from-purple-900/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  About
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                </CardTitle>
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
                      <Input id="website" name="website" value={profileData.social_links.website} onChange={handleSocialLinkChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input id="twitter" name="twitter" value={profileData.social_links.twitter} onChange={handleSocialLinkChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input id="instagram" name="instagram" value={profileData.social_links.instagram} onChange={handleSocialLinkChange} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="youtube">YouTube</Label>
                      <Input id="youtube" name="youtube" value={profileData.social_links.youtube} onChange={handleSocialLinkChange} />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <p className="text-muted-foreground">{producer.bio || 'No bio provided.'}</p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-sm">
                      <div className="font-medium mb-2">Contact & Socials</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          </div>
                          <div className="truncate">{producer.email}</div>
                        </div>
                        
                        {producer.social_links?.website && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                            </div>
                            <a href={producer.social_links.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              {producer.social_links.website.replace(/^https?:\/\//, '')}
                            </a>
                          </div>
                        )}
                        
                        {producer.social_links?.twitter && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                            </div>
                            <a href={producer.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              @{producer.social_links.twitter.split('/').pop()}
                            </a>
                          </div>
                        )}
                        
                        {producer.social_links?.instagram && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                            </div>
                            <a href={producer.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              @{producer.social_links.instagram.split('/').pop()}
                            </a>
                          </div>
                        )}
                        
                        {producer.social_links?.youtube && (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                            </div>
                            <a href={producer.social_links.youtube} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                              YouTube
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
              
              {!isEditing && (
                <CardFooter className="bg-muted/30 px-6 py-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Member since {new Date(producer.created_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </div>
                  <Badge variant="outline">
                    {producer.country || 'Nigeria'}
                  </Badge>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Beats Section */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  Top Beats
                  <div className="h-1 w-8 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Popular tracks from {producer.stage_name}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link to={`/producer/${producerId}/beats`}>
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {beats.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Beats
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    124
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Sales
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    43
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Followers
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-amber-500/10 border-amber-500/20">
                <CardContent className="p-4 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                    4.8
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Avg. Rating
                  </div>
                </CardContent>
              </Card>
            </div>

            {beats.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <FileMusic className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No beats available</h3>
                  <p className="text-muted-foreground mb-4">
                    This producer hasn't published any beats yet.
                  </p>
                </div>
              </Card>
            ) : (
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
            )}
            
            {/* Reviews Section */}
            <div className="mt-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    Reviews & Ratings
                    <div className="h-1 w-8 bg-gradient-to-r from-primary to-transparent rounded-full"></div>
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    See what other artists are saying
                  </p>
                </div>
              </div>
              
              <Card className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="bg-muted/30 p-6 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-primary mb-2">4.8</div>
                    <div className="flex items-center gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg 
                          key={star} 
                          xmlns="http://www.w3.org/2000/svg" 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill={star <= 4 ? "currentColor" : "none"} 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"
                          className={star <= 4 ? "text-amber-500" : "text-muted"}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      ))}
                    </div>
                    <div className="text-sm text-muted-foreground">Based on 28 reviews</div>
                  </div>
                  
                  <div className="md:col-span-2 p-6">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-4">
                        {[1, 2, 3].map((review) => (
                          <div key={review} className="pb-4 border-b border-border/50 last:border-0">
                            <div className="flex justify-between">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>JD</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">John Doe</div>
                                  <div className="text-xs text-muted-foreground">March 15, 2023</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <svg 
                                    key={star} 
                                    xmlns="http://www.w3.org/2000/svg" 
                                    width="12" 
                                    height="12" 
                                    viewBox="0 0 24 24" 
                                    fill={star <= 5 ? "currentColor" : "none"} 
                                    stroke="currentColor" 
                                    strokeWidth="2" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    className="text-amber-500"
                                  >
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                                  </svg>
                                ))}
                              </div>
                            </div>
                            <div className="mt-2 text-sm">
                              Absolutely fire beats! The production quality is top-notch and the melodies are catchy. I've purchased several beats and they all sound professional.
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProducerProfile;
