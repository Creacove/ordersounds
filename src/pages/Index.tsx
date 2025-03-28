import React, { useEffect } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BeatCard } from "@/components/ui/BeatCard";
import { PlaylistCard } from "@/components/library/PlaylistCard";
import { useBeats } from "@/hooks/useBeats";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ChevronRight, Music, Disc2, Disc3, Trophy, FlameKindling, Heart, Play, Pause } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/AuthContext";
import { PriceTag } from "@/components/ui/PriceTag";
import { cn } from "@/lib/utils";
import { getLicensePrice } from '@/utils/licenseUtils';
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";

export default function Index() {
  const { 
    trendingBeats, 
    newBeats, 
    isLoading,
    toggleFavorite,
    isFavorite,
    isPurchased
  } = useBeats();
  const { user, currency } = useAuth();
  const { playBeat, isPlaying, currentBeat } = usePlayer();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = "Creacove | Find the perfect beat for your next hit";
  }, []);

  const { data: featuredBeats, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featuredBeats'],
    queryFn: async () => {
      const { data, error } = await supabase
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
          basic_license_price_local,
          basic_license_price_diaspora,
          genre,
          bpm,
          status
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(4);
        
      if (error) {
        throw error;
      }

      return data.map(beat => ({
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
        cover_image_url: beat.cover_image,
        preview_url: beat.audio_preview,
        basic_license_price_local: beat.basic_license_price_local || 0,
        basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
        genre: beat.genre,
        bpm: beat.bpm,
        status: beat.status as 'draft' | 'published',
      }));
    },
    enabled: true
  });

  const { data: playlists, isLoading: isPlaylistsLoading } = useQuery({
    queryKey: ['homePlaylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_public', true)
        .order('created_date', { ascending: false })
        .limit(5);
        
      if (error) {
        throw error;
      }
      
      return data.map(playlist => ({
        ...playlist,
        created_at: playlist.created_date
      }));
    },
    enabled: true
  });

  const { data: producerOfWeek } = useQuery({
    queryKey: ['specificProducer'],
    queryFn: async () => {
      const producerId = 'fed34a00-a027-46ba-8598-cbeb2fe91ce0';
      const { data, error: producerError } = await supabase
        .from('users')
        .select('id, stage_name, full_name, profile_picture, bio, country')
        .eq('id', producerId)
        .single();
      
      if (producerError || !data) {
        console.error('Error fetching specified producer:', producerError);
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('users')
          .select('id, stage_name, full_name, profile_picture, bio, country')
          .eq('stage_name', 'Creacove Afrobeats Challenge')
          .single();
          
        if (fallbackError || !fallbackData) {
          console.error('Error fetching fallback producer:', fallbackError);
          return {
            id: producerId, 
            name: 'Creacove Afrobeats Challenge', 
            image: '/placeholder.svg',
            bio: 'Join our weekly beat challenge and showcase your talent!',
            country: 'Global',
            beatsCount: 0,
            salesCount: 0
          };
        }
        
        return {
          id: fallbackData.id, 
          name: fallbackData.stage_name || fallbackData.full_name || 'Creacove Afrobeats Challenge', 
          image: fallbackData.profile_picture || '/placeholder.svg',
          bio: fallbackData.bio || 'Join our weekly beat challenge and showcase your talent!',
          country: fallbackData.country || 'Global',
          beatsCount: 0,
          salesCount: 0
        };
      }
      
      const { count: beatsCount } = await supabase
        .from('beats')
        .select('id', { count: 'exact', head: true })
        .eq('producer_id', data.id);
      
      const { data: producerBeats } = await supabase
        .from('beats')
        .select('id')
        .eq('producer_id', data.id);
      
      let salesCount = 0;
      
      if (producerBeats && producerBeats.length > 0) {
        const beatIds = producerBeats.map(beat => beat.id);
        
        const { count } = await supabase
          .from('user_purchased_beats')
          .select('id', { count: 'exact', head: true })
          .in('beat_id', beatIds);
          
        salesCount = count || 0;
      }
      
      return {
        id: data.id, 
        name: data.stage_name || data.full_name || 'Creacove Afrobeats Challenge', 
        image: data.profile_picture || '/placeholder.svg',
        bio: data.bio || 'Join our weekly beat challenge and showcase your talent!',
        country: data.country || 'Global',
        beatsCount: beatsCount || 0,
        salesCount: salesCount || 0
      };
    },
    enabled: true
  });

  const { data: weeklyPicks, isLoading: isWeeklyLoading } = useQuery({
    queryKey: ['weeklyPicks'],
    queryFn: async () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          favorites_count,
          purchase_count,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          license_type,
          cover_image
        `)
        .eq('status', 'published')
        .order('favorites_count', { ascending: false })
        .limit(3);
        
      if (error) {
        throw error;
      }
      
      return data.map(beat => ({
        id: beat.id,
        title: beat.title,
        producer_id: beat.producer_id,
        producer_name: beat.users?.stage_name || beat.users?.full_name || 'Unknown Producer',
        favorites_count: beat.favorites_count || 0,
        purchase_count: beat.purchase_count || 0,
        basic_license_price_local: beat.basic_license_price_local || 0,
        basic_license_price_diaspora: beat.basic_license_price_diaspora || 0,
        premium_license_price_local: beat.premium_license_price_local || 0,
        premium_license_price_diaspora: beat.premium_license_price_diaspora || 0,
        exclusive_license_price_local: beat.exclusive_license_price_local || 0,
        exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora || 0,
        license_type: beat.license_type || 'basic',
        cover_image_url: beat.cover_image || '/placeholder.svg'
      }));
    },
    enabled: true
  });

  const handleBeatClick = (beatId: string) => {
    navigate(`/beat/${beatId}`);
  };
  
  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlists/${playlistId}`);
  };
  
  const handleProducerClick = () => {
    if (producerOfWeek) {
      navigate(`/producer/${producerOfWeek.id}`);
    }
  };

  const handleToggleFavorite = (beatId: string) => {
    if (!user) {
      toast.error("Please log in to add favorites");
      return;
    }
    toggleFavorite(beatId);
  };
  
  const handlePlayWeeklyPick = (beat) => {
    playBeat(beat);
  };

  const isCurrentlyPlaying = (beatId: string) => {
    return isPlaying && currentBeat?.id === beatId;
  };

  const getLicenseLocalPrice = (beat: any) => {
    return getLicensePrice(beat, beat.license_type || 'basic', false);
  };
  
  const getLicenseDiasporaPrice = (beat: any) => {
    return getLicensePrice(beat, beat.license_type || 'basic', true);
  };

  return (
    <MainLayoutWithPlayer>
      <section className="bg-gradient-to-b from-primary/20 to-background pt-4 pb-8 md:pt-8 md:pb-12">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center text-center space-y-4 md:space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tighter">
              Find the Perfect Beat for Your Next Hit
            </h1>
            <p className="text-muted-foreground max-w-[700px] md:text-lg">
              Browse thousands of high-quality beats from top producers. Creacove makes it easy to find, license, and download the perfect beat for your music.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-4">
              <Button size="lg" onClick={() => navigate('/trending')}>
                Browse Beats
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/producers')}>
                Discover Producers
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="text-primary h-5 w-5" />
              <h2 className="text-2xl font-bold tracking-tight">Producer of the Week</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/producers')} className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {!producerOfWeek ? (
            <div className="w-full h-48 rounded-lg bg-card animate-pulse" />
          ) : (
            <div className="rounded-xl overflow-hidden bg-card border shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 aspect-square md:aspect-auto relative overflow-hidden">
                  <img 
                    src={producerOfWeek?.image || "/placeholder.svg"} 
                    alt={producerOfWeek?.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent md:hidden flex items-end p-4">
                    <h3 className="text-xl font-bold text-white">{producerOfWeek?.name}</h3>
                  </div>
                </div>
                <div className="md:col-span-2 p-4 md:p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold hidden md:block mb-2">{producerOfWeek?.name}</h3>
                    <div className="flex flex-wrap gap-3 mb-2 md:mb-4">
                      {producerOfWeek?.country && (
                        <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {producerOfWeek?.country}
                        </span>
                      )}
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                        {producerOfWeek?.beatsCount} {producerOfWeek?.beatsCount === 1 ? 'Beat' : 'Beats'}
                      </span>
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-full">
                        {producerOfWeek?.salesCount} {producerOfWeek?.salesCount === 1 ? 'Sale' : 'Sales'}
                      </span>
                    </div>
                    <p className="text-muted-foreground mb-4 line-clamp-3 md:line-clamp-5">
                      {producerOfWeek?.bio || "Join our weekly beat challenge and showcase your talent!"}
                    </p>
                  </div>
                  <div className="flex flex-col xs:flex-row gap-2">
                    <Button onClick={handleProducerClick}>
                      View Profile
                    </Button>
                    <Button variant="outline" onClick={() => navigate(`/producer/${producerOfWeek?.id}/beats`, { state: { from: '/' } })}>
                      Browse All Beats
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 md:py-12 bg-gradient-to-r from-primary/5 to-muted">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FlameKindling className="text-primary h-5 w-5" />
              <h2 className="text-2xl font-bold tracking-tight">Weekly Picks</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trending')} className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {isWeeklyLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 md:h-40 bg-card animate-pulse rounded-lg"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {weeklyPicks?.map((beat, index) => (
                <div 
                  key={beat.id}
                  className="group relative overflow-hidden rounded-lg border bg-card cursor-pointer"
                  onClick={() => handleBeatClick(beat.id)}
                >
                  <div className="absolute top-0 left-0 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg rounded-br-lg z-10">
                    {index + 1}
                  </div>
                  <div className="flex items-center space-x-4 p-4">
                    <div className="flex-shrink-0 relative">
                      <div className="h-20 w-20 rounded overflow-hidden">
                        <img 
                          src={beat.cover_image_url || "/placeholder.svg"} 
                          alt={beat.title} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-medium truncate group-hover:text-primary transition-colors">
                        {beat.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {beat.producer_name}
                      </p>
                      <div className="mt-2">
                        <PriceTag 
                          localPrice={getLicenseLocalPrice(beat)}
                          diasporaPrice={getLicenseDiasporaPrice(beat)}
                          size="sm"
                          licenseType={beat.license_type !== 'basic' ? beat.license_type : undefined}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "flex items-center justify-between p-3 border-t border-border bg-muted/50",
                    isMobile && "text-xs"
                  )}>
                    <span className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(beat.id);
                        }}
                      >
                        <Heart 
                          className={cn(
                            "h-4 w-4",
                            isFavorite(beat.id) ? "text-purple-500 fill-purple-500" : "text-muted-foreground"
                          )} 
                        />
                      </Button>
                      <span>{beat.favorites_count} likes</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayWeeklyPick(beat);
                      }}
                    >
                      {isCurrentlyPlaying(beat.id) ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {isPurchased(beat.id) && (
                    <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full">
                      Purchased
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-8 md:py-12">
        <div className="container grid md:grid-cols-2 gap-8 px-4 md:px-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Disc2 className="text-primary h-5 w-5" />
                <h2 className="text-2xl font-bold tracking-tight">Trending Beats</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/trending')} className="gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-md mb-2" />
                    <div className="h-4 bg-muted rounded-md w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded-md w-1/2" />
                  </div>
                ))
              ) : (
                trendingBeats?.slice(0, 4).map(beat => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                  />
                ))
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Disc3 className="text-primary h-5 w-5" />
                <h2 className="text-2xl font-bold tracking-tight">New Releases</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/new')} className="gap-1">
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-md mb-2" />
                    <div className="h-4 bg-muted rounded-md w-2/3 mb-2" />
                    <div className="h-3 bg-muted rounded-md w-1/2" />
                  </div>
                ))
              ) : (
                newBeats?.slice(0, 4).map(beat => (
                  <BeatCard 
                    key={beat.id} 
                    beat={beat} 
                    onToggleFavorite={toggleFavorite}
                    isFavorite={isFavorite(beat.id)}
                    isPurchased={isPurchased(beat.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 bg-card">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Featured Playlists</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/playlists')} className="gap-1">
              View All
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          {isPlaylistsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-md mb-2" />
                  <div className="h-4 bg-muted rounded-md w-2/3 mb-2" />
                  <div className="h-3 bg-muted rounded-md w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists?.map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  onClick={handlePlaylistClick}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mb-10 bg-gradient-to-br from-purple-50/10 to-transparent dark:from-purple-900/5 rounded-lg p-6 border border-purple-200/20 dark:border-purple-800/20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Producer of the Week</h2>
            <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
              <Star size={12} className="mr-1" /> Featured
            </Badge>
          </div>
          <Link to={`/producer/${producerOfWeek?.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
            View profile
            <ArrowRight size={14} />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="bg-card rounded-lg overflow-hidden border shadow-sm h-full flex flex-col">
              <div className="relative aspect-square md:aspect-auto md:h-64 bg-gradient-to-b from-primary/5 to-primary/10">
                <img 
                  src={producerOfWeek?.image} 
                  alt={producerOfWeek?.name}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 p-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{producerOfWeek?.name}</h3>
                  </div>
                  <div className="text-sm text-white/80 mt-1">
                    {producerOfWeek?.beatsCount} beats • {(producerOfWeek?.salesCount / 1000).toFixed(1)}k sales
                  </div>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-sm text-muted-foreground">{producerOfWeek?.bio}</p>
                <div className="mt-4 pt-4 border-t flex-1 flex flex-col justify-end">
                  <Button variant="outline" className="w-full gap-2" asChild>
                    <Link to={`/producer/${producerOfWeek?.id}`}>
                      <span>View Profile</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-medium">Top Beats by {producerOfWeek?.name}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="w-12 px-4 py-3 text-left font-medium text-sm"></th>
                      <th className="px-4 py-3 text-left font-medium text-sm">Title</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-left font-medium text-sm">Genre</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left font-medium text-sm">BPM</th>
                      <th className="px-4 py-3 text-left font-medium text-sm">Price</th>
                      <th className="px-4 py-3 text-right font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {producerOfWeek?.beats.map((beat) => (
                      <tr key={beat.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="w-10 h-10 rounded overflow-hidden">
                            <img 
                              src={beat.cover_image_url} 
                              alt={beat.title}
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium max-w-[120px] truncate">{beat.title}</td>
                        <td className="hidden sm:table-cell px-4 py-3">{beat.genre}</td>
                        <td className="hidden md:table-cell px-4 py-3">{beat.bpm} BPM</td>
                        <td className="px-4 py-3">₦{(beat.basic_license_price_local || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                playBeat(beat);
                              }}
                            >
                              {isCurrentlyPlaying(beat.id) ? (
                                <Pause size={16} />
                              ) : (
                                <Play size={16} />
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className={cn(
                                "h-8 w-8",
                                isFavorite(beat.id) ? "text-purple-500" : ""
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(beat.id);
                              }}
                            >
                              <Heart 
                                size={16} 
                                fill={isFavorite(beat.id) ? "currentColor" : "none"} 
                              />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t bg-muted/20 flex justify-center">
                <Button variant="link" size="sm" className="gap-1" asChild>
                  <Link to={`/producer/${producerOfWeek?.id}`}>
                    <span>Browse all beats from this producer</span>
                    <ArrowRight size={14} />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayoutWithPlayer>
  );
}
