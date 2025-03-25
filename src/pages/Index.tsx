import React, { useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { 
  Play, TrendingUp, Music, ArrowRight, Headphones, 
  Star, Award, UserCheck, ChevronRight, ShoppingCart, 
  Clock, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { PriceTag } from "@/components/ui/PriceTag";

const Index = () => {
  const { trendingBeats, newBeats, featuredBeat, isLoading } = useBeats();
  const { currency } = useAuth();
  
  // Fetch top producers
  const { data: topProducers = [] } = useQuery({
    queryKey: ['indexTopProducers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, stage_name, profile_picture')
        .eq('role', 'producer')
        .order('featured_beats', { ascending: false })
        .limit(6);
      
      if (error) {
        console.error('Error fetching producers:', error);
        return [
          { id: '1', name: 'Metro Boomin', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
          { id: '2', name: 'JUNE', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
          { id: '3', name: 'DJ Eazie', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: false },
          { id: '4', name: 'Beats by Dre', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
          { id: '5', name: 'KBeatz', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: false },
          { id: '6', name: 'Sound Vibe', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: false },
        ];
      }
      
      return data.map(producer => ({
        id: producer.id,
        name: producer.stage_name || producer.full_name,
        avatar: producer.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
        verified: true // For now we'll show all as verified
      }));
    },
    enabled: true
  });

  // Fetch featured playlists
  const { data: featuredPlaylists = [] } = useQuery({
    queryKey: ['indexFeaturedPlaylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, cover_image, beats, is_public')
        .eq('is_public', true)
        .limit(5);
      
      if (error) {
        console.error('Error fetching playlists:', error);
        return [
          { id: '1', title: 'Piano Vibes', color: 'from-blue-500 to-purple-500', image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png' },
          { id: '2', title: 'Guitar Classics', color: 'from-orange-500 to-red-500', image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png' },
          { id: '3', title: 'Afro Fusion', color: 'from-green-500 to-emerald-500', image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png' },
          { id: '4', title: 'Smooth R&B', color: 'from-pink-500 to-purple-500', image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png' },
          { id: '5', title: 'Trap Kings', color: 'from-yellow-500 to-amber-500', image: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png' },
        ];
      }

      // Assign a random gradient color to each playlist
      const gradients = [
        'from-blue-500 to-purple-500',
        'from-orange-500 to-red-500',
        'from-green-500 to-emerald-500',
        'from-pink-500 to-purple-500',
        'from-yellow-500 to-amber-500',
      ];
      
      return data.map((playlist, index) => ({
        id: playlist.id,
        title: playlist.name,
        color: gradients[index % gradients.length],
        image: playlist.cover_image || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'
      }));
    },
    enabled: true
  });

  // Producer of the week - simplified to get a producer without complex queries
  const { data: producerOfWeek } = useQuery({
    queryKey: ['producerOfWeek'],
    queryFn: async () => {
      // Get a producer from the database
      const { data, error } = await supabase
        .from('users')
        .select('id, stage_name, full_name, profile_picture, bio, country')
        .eq('role', 'producer')
        .limit(1)
        .single();
      
      if (error) {
        console.error('Error fetching producer of week:', error);
        return {
          id: '1', 
          name: 'JUNE', 
          avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
          followers: 12564,
          beatsSold: 432,
          verified: true
        };
      }
      
      // Get beat count
      const { count: beatCount } = await supabase
        .from('beats')
        .select('id', { count: 'exact', head: true })
        .eq('producer_id', data.id);
      
      // Get sales count
      const { count: salesCount } = await supabase
        .from('user_purchased_beats')
        .select('id', { count: 'exact', head: true })
        .eq('beat_id', (
          supabase
            .from('beats')
            .select('id')
            .eq('producer_id', data.id)
        ));
      
      return {
        id: data.id, 
        name: data.stage_name || data.full_name, 
        avatar: data.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
        followers: Math.floor(Math.random() * 15000) + 5000, // Random followers count for now
        beatsSold: salesCount || Math.floor(Math.random() * 500) + 100,
        beatCount: beatCount || 0,
        verified: true,
        bio: data.bio,
        location: data.country
      };
    },
    enabled: true
  });

  // New releases in horizontal scroll
  const newReleases = newBeats.slice(0, 8);

  // Recent top-sellers
  const topSellers = trendingBeats.slice(0, 6).map((beat, index) => ({
    ...beat,
    sales: 120 - (index * 15),
    weeklyChange: index % 2 === 0 ? `+${Math.floor(Math.random() * 20)}%` : `-${Math.floor(Math.random() * 10)}%`,
  }));

  return (
    <MainLayoutWithPlayer>
      {/* Hero section with background image */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-950 to-black text-white">
        <div 
          className="absolute inset-0 z-0 opacity-40 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url('/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png')`,
            backgroundBlendMode: 'overlay', 
          }} 
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative container mx-auto pt-12 pb-16 px-4 md:py-24 z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4 bg-purple-600/80 text-white hover:bg-purple-700/80 backdrop-blur-sm">
              Nigeria's #1 Beat Marketplace
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Find Perfect Beats for Your Next Project
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Connect with talented producers and discover unique sounds
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="bg-purple-600 text-white hover:bg-purple-700" asChild>
                <Link to="/trending">Browse Beats</Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20" asChild>
                <Link to="/producers">
                  <Headphones size={18} />
                  <span>Meet Producers</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Beats - Horizontal Cards */}
      <div className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Top Beats</h2>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                Hot 🔥
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/trending">
                <span>See all</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {trendingBeats.slice(0, 5).map((beat, index) => (
              <div key={beat.id} className="relative group overflow-hidden rounded-lg">
                <div className="aspect-[3/4] w-full overflow-hidden bg-black">
                  <img 
                    src={beat.cover_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'} 
                    alt={beat.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <h3 className="font-bold text-sm truncate">{beat.title}</h3>
                  <p className="text-xs text-white/70 truncate">{beat.producer_name}</p>
                </div>
                <div className="absolute top-2 right-2">
                  <Badge className="bg-primary/80 text-white">{`#${index + 1}`}</Badge>
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" className="rounded-full bg-primary text-white">
                    <Play size={20} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Playlists - Colorful Cards */}
      <div className="bg-black/5 dark:bg-white/5 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Collections</h2>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/playlists">
                <span>Browse all</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {featuredPlaylists.map((playlist) => (
              <Link key={playlist.id} to={`/playlist/${playlist.id}`} className="block">
                <div className={`aspect-square rounded-lg overflow-hidden bg-gradient-to-br ${playlist.color} relative group`}>
                  <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                        Collection
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{playlist.title}</h3>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                          <Play size={14} className="mr-1" /> Listen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Music Section - Improved & Responsive */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-900 py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="order-2 md:order-1">
              <Badge className="mb-6 bg-white/20 text-white border-white/10 backdrop-blur-sm">
                <Sparkles size={14} className="mr-1" /> Premium Beats
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Unlock Premium Music for Your Projects</h2>
              <p className="text-white/80 mb-6 text-lg">
                Get unlimited access to exclusive high-quality beats from top producers. Perfect for your next hit song, video, podcast, or commercial project.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-1.5 rounded-full mt-0.5">
                    <Star size={16} className="text-yellow-300" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Exclusive Rights Available</h4>
                    <p className="text-white/70 text-sm">Own your music completely with our exclusive license options</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-1.5 rounded-full mt-0.5">
                    <Music size={16} className="text-yellow-300" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">High Quality Audio</h4>
                    <p className="text-white/70 text-sm">All beats provided in pristine 24-bit WAV format</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-white/20 p-1.5 rounded-full mt-0.5">
                    <Award size={16} className="text-yellow-300" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Verified Producers</h4>
                    <p className="text-white/70 text-sm">Work with trusted, industry-vetted beat makers</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="bg-white text-purple-900 hover:bg-white/90" asChild>
                  <Link to="/trending">
                    Browse Premium Beats
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10" asChild>
                  <Link to="/producers">
                    Meet Top Producers
                  </Link>
                </Button>
              </div>
            </div>
            <div className="order-1 md:order-2 grid grid-cols-2 gap-4 max-w-md mx-auto md:mx-0">
              {trendingBeats.slice(0, 4).map((beat, index) => (
                <div key={`premium-${beat.id}`} className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden transform transition-transform hover:scale-105">
                  <div className="aspect-square relative">
                    <img 
                      src={beat.cover_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'} 
                      alt={beat.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-white font-medium text-sm line-clamp-1">{beat.title}</h4>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-white/70 text-xs line-clamp-1">{beat.producer_name}</span>
                        <PriceTag 
                          localPrice={beat.premium_license_price_local || 10000}
                          diasporaPrice={beat.premium_license_price_diaspora || 40}
                          size="sm"
                          className="bg-white/20 text-white"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"
                    >
                      <Play size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/10 dark:bg-primary/5 py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">DON'T WAIT, JOIN TODAY!</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            The most talented producers are waiting for you. Sign up now and get access to thousands of premium beats.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </div>

      {/* Top Producers - Circle Avatars */}
      <div className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Top Producers</h2>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/producers">
                <span>View all</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-6 scrollbar-hide">
            {topProducers.map((producer) => (
              <Link key={producer.id} to={`/producer/${producer.id}`} className="flex flex-col items-center gap-2 min-w-[100px]">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                    <AvatarImage src={producer.avatar} alt={producer.name} />
                    <AvatarFallback>{producer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {producer.verified && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white rounded-full p-1">
                      <UserCheck size={16} />
                    </div>
                  )}
                </div>
                <span className="text-sm font-medium text-center">{producer.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Producer of the Week - Special Highlight */}
      <div className="bg-black/10 dark:bg-white/5 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Producer Of The Week</h2>
              <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">
                <Star size={12} className="mr-1" /> Featured
              </Badge>
            </div>
            <Button variant="ghost" size="sm"></Button>
          </div>
          
          {producerOfWeek && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg overflow-hidden shadow-md md:col-span-1">
                <div className="aspect-square bg-black/50 relative">
                  <img 
                    src={producerOfWeek.avatar} 
                    alt={producerOfWeek.name}
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-white">{producerOfWeek.name}</h3>
                      {producerOfWeek.verified && (
                        <Badge variant="outline" className="bg-primary/30 border-primary/30 text-white">
                          <UserCheck size={12} className="mr-1" /> Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 text-white/80 text-sm">
                      <div className="flex items-center gap-1">
                        <ShoppingCart size={14} />
                        <span>{producerOfWeek.beatsSold} beats sold</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserCheck size={14} />
                        <span>{(producerOfWeek.followers / 1000).toFixed(1)}k followers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trendingBeats.slice(0, 4).map((beat) => (
                    <Card key={beat.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center p-4">
                        <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0">
                          <img 
                            src={beat.cover_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'} 
                            alt={beat.title}
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate">{beat.title}</h4>
                          <p className="text-xs text-muted-foreground">{beat.genre}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs py-0 px-1.5">
                              {beat.bpm} BPM
                            </Badge>
                            <PriceTag 
                              localPrice={beat.price_local || 5000}
                              diasporaPrice={beat.price_diaspora || 20}
                              size="sm"
                              className="text-xs py-0 px-1.5"
                            />
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0 ml-2 rounded-full h-8 w-8 bg-primary/10">
                          <Play size={16} className="text-primary" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="mt-4 flex justify-center">
                  <Button variant="outline" className="gap-2" asChild>
                    <Link to={`/producer/${producerOfWeek.id}`}>
                      <span>View Producer Profile</span>
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Releases Horizontal Scroll */}
      <div className="bg-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">New Releases</h2>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/20">
                <Clock size={12} className="mr-1" /> Just Dropped
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/new">
                <span>See all</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
            {newReleases.map((beat) => (
              <div key={beat.id} className="min-w-[200px] max-w-[200px]">
                <BeatCard beat={beat} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Picks - Updated to ensure currency changes reflect */}
      <div className="bg-black/5 dark:bg-white/5 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">Weekly Picks</h2>
              <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/20">
                <Award size={12} className="mr-1" /> Top Charts
              </Badge>
            </div>
            <Button variant="ghost" size="sm" className="gap-1" asChild>
              <Link to="/charts">
                <span>Full charts</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          </div>
          
          <div className="bg-card rounded-lg overflow-hidden border shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Producer</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Genre</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sales</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Weekly</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {topSellers.map((beat, index) => (
                    <tr key={beat.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded overflow-hidden mr-3">
                            <img 
                              src={beat.cover_image_url || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png'} 
                              alt={beat.title}
                              className="h-full w-full object-cover" 
                            />
                          </div>
                          <span className="text-sm font-medium">{beat.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link 
                          to={`/producer/${beat.producer_id}`}
                          className="hover:text-primary hover:underline"
                        >
                          {beat.producer_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm">{beat.genre}</td>
                      <td className="px-4 py-3 text-sm">{beat.sales}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          beat.weeklyChange.startsWith('+') 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        )}>
                          {beat.weeklyChange}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <PriceTag 
                          localPrice={beat.price_local || 5000}
                          diasporaPrice={beat.price_diaspora || 20}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Play size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything You Need for Your Music
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="overflow-hidden border border-border/40 hover:border-border transition-all hover:shadow-md bg-gradient-to-br from-purple-50/5 to-transparent dark:from-purple-900/5">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Trending Beats</CardTitle>
              <CardDescription>
                Discover the hottest beats that are making waves across Nigeria and beyond
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 gap-1" asChild>
                <Link to="/trending">
                  <span>Explore trending</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden border border-border/40 hover:border-border transition-all hover:shadow-md bg-gradient-to-br from-blue-50/5 to-transparent dark:from-blue-900/5">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Music className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Diverse Genres</CardTitle>
              <CardDescription>
                From Afrobeat to Amapiano, find beats across all popular genres to match your style
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 gap-1" asChild>
                <Link to="/genres">
                  <span>Browse genres</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden border border-border/40 hover:border-border transition-all hover:shadow-md bg-gradient-to-br from-pink-50/5 to-transparent dark:from-pink-900/5">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                <Play className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle>Instant Preview</CardTitle>
              <CardDescription>
                Listen to high-quality previews before purchasing, with our seamless audio player
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="link" className="p-0 gap-1" asChild>
                <Link to="/new">
                  <span>New releases</span>
                  <ArrowRight size={16} />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Index;
