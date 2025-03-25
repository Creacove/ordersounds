import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Filter, ArrowRight, Sparkles, Flame, Clock, ChevronRight, Headphones, Star, Award, UserCheck, Music, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { getUserPlaylists } from "@/lib/playlistService";
import { PlaylistCard } from "@/components/library/PlaylistCard";

export default function Home() {
  const { featuredBeat, trendingBeats, newBeats, isLoading } = useBeats();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { playBeat } = usePlayer();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: topProducers = [], isLoading: isLoadingProducers } = useQuery({
    queryKey: ['topProducers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, stage_name, profile_picture')
        .eq('role', 'producer')
        .order('featured_beats', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching producers:', error);
        return [];
      }
      
      return data.map(producer => ({
        id: producer.id,
        name: producer.stage_name || producer.full_name,
        avatar: producer.profile_picture || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
        verified: true
      }));
    },
    enabled: true
  });

  const { data: featuredPlaylists = [], isLoading: isLoadingPlaylists } = useQuery({
    queryKey: ['featuredPlaylists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlists')
        .select('id, name, cover_image, beats, is_public')
        .eq('is_public', true)
        .limit(4);
      
      if (error) {
        console.error('Error fetching playlists:', error);
        return [];
      }

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
        image: playlist.cover_image || '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
        tracks: (playlist.beats?.length || 0),
      }));
    },
    enabled: true
  });

  const handlePlayFeatured = () => {
    if (featuredBeat) {
      playBeat(featuredBeat);
    }
    setIsPlaying(!isPlaying);
  };

  const handlePlayBeat = (beat) => {
    playBeat(beat);
  };

  const navigateToBeat = (beatId) => {
    navigate(`/beat/${beatId}`);
  };

  const navigateToPlaylist = (playlistId) => {
    navigate(`/playlist/${playlistId}`);
  };

  const categories = [
    { name: "Afrobeat", icon: <Sparkles size={16} /> },
    { name: "Hip Hop", icon: <Flame size={16} /> },
    { name: "R&B", icon: <Clock size={16} /> },
    { name: "Amapiano", icon: <Sparkles size={16} /> },
  ];

  const weeklyPicks = trendingBeats.slice(0, 6);

  const producerOfWeek = {
    id: '1', 
    name: 'JUNE', 
    avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png',
    followers: 12564,
    beatsSold: 432,
    bio: "Award-winning producer specializing in Afrobeat and Amapiano fusion. Worked with top artists across Nigeria and beyond.",
    verified: true,
    beats: trendingBeats.slice(0, 4)
  };

  return (
    <MainLayoutWithPlayer>
      <div className="min-h-screen">
        {featuredBeat && (
          <section className="relative h-[200px] md:h-[250px] lg:h-[300px] overflow-hidden">
            <div className="absolute inset-0 z-0">
              <img 
                src={featuredBeat.cover_image_url} 
                alt={featuredBeat.title}
                className="w-full h-full object-cover transition-transform duration-10000 transform-gpu hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            </div>
            
            <div className="relative z-10 h-full container flex flex-col justify-center">
              <div className="max-w-2xl">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3 animate-pulse-gentle">
                  Featured Beat
                </div>
                <h1 
                  className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-white cursor-pointer hover:underline"
                  onClick={() => navigate(`/beat/${featuredBeat.id}`)}
                >
                  {featuredBeat.title}
                </h1>
                <div 
                  className="text-md font-medium mb-2 text-white/90 cursor-pointer hover:underline"
                  onClick={() => navigate(`/producer/${featuredBeat.producer_id}`)}
                >
                  {featuredBeat.producer_name}
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="text-sm text-white/60">
                    {featuredBeat.bpm} BPM
                  </div>
                  <div className="text-sm text-white/60">
                    •
                  </div>
                  <div className="text-sm text-white/60">
                    {featuredBeat.genre}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handlePlayFeatured} 
                    className="gap-2 bg-primary hover:bg-primary/90 shadow-md"
                    size="sm"
                  >
                    {isPlaying ? <span>Pause</span> : (
                      <>
                        <Play size={16} className="ml-1" />
                        <span>Listen now</span>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20"
                    onClick={() => navigate(`/beat/${featuredBeat.id}`)}
                  >
                    View details
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="container py-4 overflow-hidden bg-black/5 dark:bg-white/5">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-2 px-6">
            <div className="flex gap-2">
              {categories.map((category, index) => (
                <Link 
                  key={index} 
                  to={`/genres?filter=${category.name.toLowerCase()}`}
                  className="flex-shrink-0 px-4 py-2 border border-input rounded-full flex items-center gap-2 hover:bg-accent transition-colors text-sm"
                >
                  {category.icon}
                  <span>{category.name}</span>
                </Link>
              ))}
              <Link 
                to="/genres" 
                className="flex-shrink-0 px-4 py-2 border border-input rounded-full flex items-center gap-2 text-primary hover:bg-primary/10 transition-colors text-sm"
              >
                <span>All genres</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        <div className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Browse Beats</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} />
              <span>Filter</span>
            </Button>
          </div>

          {showFilters && (
            <div className="bg-card rounded-lg p-4 mb-6 animate-slide-down shadow-sm border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price Range</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>Any price</option>
                    <option>Under ₦5,000</option>
                    <option>₦5,000 - ₦10,000</option>
                    <option>₦10,000 - ₦15,000</option>
                    <option>Over ₦15,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Genre</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>All genres</option>
                    <option>Afrobeat</option>
                    <option>Amapiano</option>
                    <option>Hip Hop</option>
                    <option>R&B</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Track Type</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>All types</option>
                    <option>Single</option>
                    <option>Mix</option>
                    <option>Loop</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <select className="w-full rounded-md bg-muted border-border p-2">
                    <option>Most Popular</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm" className="shadow-sm">Apply Filters</Button>
              </div>
            </div>
          )}

          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Trending Beats</h2>
                <div className="bg-rose-500/10 text-rose-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Flame size={12} />
                  <span>Hot</span>
                </div>
              </div>
              <Link to="/trending" className="text-sm text-primary hover:underline flex items-center gap-1">
                Show all
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "bg-card rounded-lg aspect-square animate-pulse",
                      "opacity-75"
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {trendingBeats.slice(0, 5).map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            )}
          </section>

          <section className="bg-card/50 p-4 sm:p-6 rounded-lg mb-10 border">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Weekly Picks</h2>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Star size={12} className="mr-1" /> Selected
                </Badge>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {weeklyPicks.map((beat) => (
                <div 
                  key={beat.id} 
                  className="p-3 bg-background/50 rounded-md border border-border/50 flex items-center gap-3 hover:bg-background/80 transition-colors cursor-pointer"
                  onClick={() => navigate(`/beat/${beat.id}`)}
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded overflow-hidden flex-shrink-0">
                    <img 
                      src={beat.cover_image_url} 
                      alt={beat.title}
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-sm md:text-base truncate">{beat.title}</h3>
                    <p 
                      className="text-xs text-muted-foreground truncate hover:text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/producer/${beat.producer_id}`);
                      }}
                    >
                      {beat.producer_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs py-0 px-1.5 h-5 truncate">
                        {beat.genre}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ₦{beat.price_local}
                      </span>
                    </div>
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="flex-shrink-0 h-8 w-8 rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayBeat(beat);
                    }}
                  >
                    <Play size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">New Beats</h2>
                <div className="bg-purple-500/10 text-purple-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Sparkles size={12} />
                  <span>Fresh</span>
                </div>
              </div>
              <Link to="/new" className="text-sm text-primary hover:underline flex items-center gap-1">
                Show all
                <ArrowRight size={14} />
              </Link>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "bg-card rounded-lg aspect-square animate-pulse",
                      "opacity-75"
                    )}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {newBeats.slice(0, 5).map((beat) => (
                  <BeatCard key={beat.id} beat={beat} />
                ))}
              </div>
            )}
          </section>

          <section className="mb-10 bg-background pt-4 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Top Producers</h2>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/10">
                  <Award size={12} className="mr-1" /> Trending
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                <Link to="/producers">
                  <span>View all</span>
                  <ChevronRight size={16} />
                </Link>
              </Button>
            </div>
            
            <div className="flex overflow-x-auto pb-4 gap-5 hide-scrollbar">
              {isLoadingProducers ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2 min-w-[90px]">
                    <div className="relative">
                      <div className="h-[90px] w-[90px] rounded-full bg-muted animate-pulse" />
                    </div>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                topProducers.map((producer) => (
                  <Link key={producer.id} to={`/producer/${producer.id}`} className="flex flex-col items-center gap-2 min-w-[90px]">
                    <div className="relative">
                      <Avatar className="h-[90px] w-[90px] border-2 border-background shadow-md">
                        <AvatarImage src={producer.avatar} alt={producer.name} />
                        <AvatarFallback>{producer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {producer.verified && (
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <UserCheck size={16} />
                        </div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-center truncate max-w-[90px]">{producer.name}</span>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="mb-10">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Featured Playlists</h2>
                <Badge className="bg-purple-500/10 text-purple-500 text-xs px-2 py-0.5 rounded-full font-medium">
                  <Star size={12} />
                  <span className="ml-1">Curated</span>
                </Badge>
              </div>
              <Link to="/playlists" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {isLoadingPlaylists ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
                ))
              ) : (
                featuredPlaylists.map((playlist) => (
                  <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="block rounded-lg overflow-hidden group">
                    <div className={`aspect-square bg-gradient-to-br ${playlist.color} relative`}>
                      <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                      <div className="p-4 flex flex-col h-full justify-between">
                        <div className="flex justify-end">
                          <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                            {playlist.tracks} tracks
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
                ))
              )}
            </div>
          </section>

          <section className="mb-10 bg-primary/5 rounded-lg py-8 px-6">
            {user ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Discover More Music
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Explore our vast library of beats from top producers or check out your personal recommendations.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                    <Link to="/trending">Explore Trending</Link>
                  </Button>
                  <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5" asChild>
                    <Link to="/favorites">Your Favorites</Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                  Unlock Premium Music
                </h2>
                <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Join today to access exclusive beats, save favorites, and connect with top producers.
                </p>
                <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
                  <Link to="/signup">Create Account</Link>
                </Button>
              </>
            )}
          </section>

          <section className="mb-10 bg-gradient-to-br from-purple-50/10 to-transparent dark:from-purple-900/5 rounded-lg p-6 border border-purple-200/20 dark:border-purple-800/20">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Producer of the Week</h2>
                <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                  <Star size={12} className="mr-1" /> Featured
                </Badge>
              </div>
              <Link to={`/producer/${producerOfWeek.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                View profile
                <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                <div className="bg-card rounded-lg overflow-hidden border shadow-sm h-full flex flex-col">
                  <div className="relative aspect-square md:aspect-auto md:h-64 bg-gradient-to-b from-primary/5 to-primary/10">
                    <img 
                      src={producerOfWeek.avatar} 
                      alt={producerOfWeek.name}
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute bottom-0 p-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">{producerOfWeek.name}</h3>
                        {producerOfWeek.verified && (
                          <Badge variant="outline" className="bg-primary/30 border-primary/30 text-white">
                            <UserCheck size={12} className="mr-1" /> Verified
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-white/80 mt-1">
                        {producerOfWeek.beatsSold} beats sold • {(producerOfWeek.followers / 1000).toFixed(1)}k followers
                      </div>
                    </div>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <p className="text-sm text-muted-foreground">{producerOfWeek.bio}</p>
                    <div className="mt-4 pt-4 border-t flex-1 flex flex-col justify-end">
                      <Button variant="outline" className="w-full gap-2" asChild>
                        <Link to={`/producer/${producerOfWeek.id}`}>
                          <UserCheck size={16} />
                          <span>Follow Producer</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
                  <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-medium">Top Beats by {producerOfWeek.name}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead className="hidden sm:table-cell">Genre</TableHead>
                          <TableHead className="hidden md:table-cell">BPM</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {producerOfWeek.beats.map((beat) => (
                          <TableRow key={beat.id}>
                            <TableCell className="p-2">
                              <div className="w-10 h-10 rounded overflow-hidden">
                                <img 
                                  src={beat.cover_image_url} 
                                  alt={beat.title}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                            </TableCell>
                            <TableCell className="font-medium max-w-[120px] truncate">{beat.title}</TableCell>
                            <TableCell className="hidden sm:table-cell">{beat.genre}</TableCell>
                            <TableCell className="hidden md:table-cell">{beat.bpm} BPM</TableCell>
                            <TableCell>₦{beat.price_local}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => handlePlayBeat(beat)}
                                >
                                  <Play size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Bookmark size={16} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 border-t bg-muted/20 flex justify-center">
                    <Button variant="link" size="sm" className="gap-1" asChild>
                      <Link to={`/producer/${producerOfWeek.id}`}>
                        <span>Browse all beats from this producer</span>
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
}
