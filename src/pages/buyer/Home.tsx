
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Filter, ArrowRight, Sparkles, Flame, Clock, ChevronRight, Headphones, Star, Award, UserCheck, Music, Bookmark, List, Volume2, Settings, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCard } from "@/components/ui/BeatCard";
import { BeatListItem } from "@/components/ui/BeatListItem";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { featuredBeat, trendingBeats, newBeats, isLoading } = useBeats();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { playBeat } = usePlayer();

  const handlePlayFeatured = () => {
    if (featuredBeat) {
      playBeat(featuredBeat);
    }
    setIsPlaying(!isPlaying);
  };

  // Categories for quick browsing
  const categories = [
    { name: "Afrobeat", icon: <Sparkles size={16} /> },
    { name: "Hip Hop", icon: <Flame size={16} /> },
    { name: "R&B", icon: <Clock size={16} /> },
    { name: "Amapiano", icon: <Sparkles size={16} /> },
  ];

  // Top producers (mock data)
  const topProducers = [
    { id: '1', name: 'Metro Boomin', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
    { id: '2', name: 'JUNE', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
    { id: '3', name: 'DJ Eazie', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: false },
    { id: '4', name: 'Beats by Dre', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: true },
    { id: '5', name: 'KBeatz', avatar: '/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png', verified: false },
  ];

  // Weekly picks in list format
  const weeklyPicks = trendingBeats.slice(0, 8);

  return (
    <MainLayoutWithPlayer>
      <div className="min-h-screen">
        {/* Hero section with featured beat - REDUCED HEIGHT */}
        {featuredBeat && (
          <section className="relative h-[250px] md:h-[300px] lg:h-[380px] overflow-hidden">
            {/* Background image with overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src={featuredBeat.cover_image_url} 
                alt={featuredBeat.title}
                className="w-full h-full object-cover transition-transform duration-10000 transform-gpu hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            </div>
            
            {/* Content */}
            <div className="relative z-10 h-full container flex flex-col justify-center">
              <div className="max-w-2xl">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-3 animate-pulse-gentle">
                  Featured Beat
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 text-white">
                  {featuredBeat.title}
                </h1>
                <div className="text-md font-medium mb-2 text-white/90">
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
                  <Button variant="outline" size="sm" className="gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20">
                    Add to favourite
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick category browse section */}
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

        {/* Main content */}
        <div className="container py-6">
          {/* Filter and search controls */}
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

          {/* Filter panel (collapsible) */}
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

          {/* Trending Beats Section */}
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

          {/* NEW SECTION: Weekly Picks as a List View with columns */}
          <section className="bg-card/50 p-6 rounded-lg mb-10 border">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Weekly Picks</h2>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                  <Star size={12} className="mr-1" /> Selected
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="gap-1">
                <List size={14} />
                <span>View as List</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {weeklyPicks.map((beat, index) => (
                <BeatListItem key={beat.id} beat={beat} />
              ))}
            </div>
          </section>

          {/* Featured Collections */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Featured Collections</h2>
                <div className="bg-purple-500/10 text-purple-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star size={12} />
                  <span>Curated</span>
                </div>
              </div>
              <Link to="/playlists" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/playlists/piano" className="block">
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 relative group">
                  <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                        Collection
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Piano Vibes</h3>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                          <Play size={14} className="mr-1" /> Listen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/playlists/guitar" className="block">
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-orange-500 to-red-500 relative group">
                  <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                        Collection
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Guitar Classics</h3>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                          <Play size={14} className="mr-1" /> Listen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/playlists/afro" className="block">
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-green-500 to-emerald-500 relative group">
                  <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                        Collection
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Afro Fusion</h3>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                          <Play size={14} className="mr-1" /> Listen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              
              <Link to="/playlists/rnb" className="block">
                <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-pink-500 to-purple-500 relative group">
                  <div className="absolute inset-0 opacity-20 bg-pattern-dots mix-blend-overlay"></div>
                  <div className="p-4 flex flex-col h-full justify-between">
                    <div className="flex justify-end">
                      <Badge variant="outline" className="bg-white/20 text-white border-white/10">
                        Collection
                      </Badge>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Smooth R&B</h3>
                      <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" className="bg-white/20 text-white hover:bg-white/30 border-none">
                          <Play size={14} className="mr-1" /> Listen
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          </section>

          {/* New Beats Section */}
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
        </div>

        {/* Top Producers - Circle Avatars - MOVED LOWER IN THE PAGE */}
        <div className="bg-background pt-4 pb-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Top Producers</h2>
              <Button variant="ghost" size="sm" className="gap-1 text-primary" asChild>
                <Link to="/producers">
                  <span>View all</span>
                  <ChevronRight size={16} />
                </Link>
              </Button>
            </div>
            
            <div className="flex overflow-x-auto pb-4 gap-5 scrollbar-hide">
              {topProducers.map((producer) => (
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
              ))}
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-primary/10 dark:bg-primary/5 py-8 mb-8">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              DON'T WAIT, JOIN TODAY!
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              The most talented producers are waiting for you. Sign up now and get access to thousands of premium beats.
            </p>
            <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>

        {/* NEW SECTION: Beat Production Resources */}
        <div className="container mx-auto px-4 mb-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Production Resources</h2>
            <Button variant="outline" size="sm" className="gap-1" asChild>
              <Link to="/resources">
                <span>Browse Resources</span>
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-purple-50/10 to-transparent dark:from-purple-900/5 border-purple-100/20 dark:border-purple-900/20 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-purple-100 dark:bg-purple-800/30 p-3 text-purple-600 dark:text-purple-400">
                    <Music size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Sample Packs</h3>
                    <p className="text-sm text-muted-foreground mb-4">Premium sample packs curated by top producers</p>
                    <Button variant="link" className="p-0 h-auto text-purple-600 dark:text-purple-400 gap-1 hover:text-purple-700" asChild>
                      <Link to="/resources/samples">
                        <span>Browse samples</span>
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50/10 to-transparent dark:from-blue-900/5 border-blue-100/20 dark:border-blue-900/20 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-blue-100 dark:bg-blue-800/30 p-3 text-blue-600 dark:text-blue-400">
                    <Volume2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Mixing Tutorials</h3>
                    <p className="text-sm text-muted-foreground mb-4">Learn the art of mixing from industry professionals</p>
                    <Button variant="link" className="p-0 h-auto text-blue-600 dark:text-blue-400 gap-1 hover:text-blue-700" asChild>
                      <Link to="/resources/tutorials">
                        <span>Watch tutorials</span>
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50/10 to-transparent dark:from-green-900/5 border-green-100/20 dark:border-green-900/20 hover:shadow-md transition-all">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-full bg-green-100 dark:bg-green-800/30 p-3 text-green-600 dark:text-green-400">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Plugin Deals</h3>
                    <p className="text-sm text-muted-foreground mb-4">Exclusive discounts on premium audio plugins</p>
                    <Button variant="link" className="p-0 h-auto text-green-600 dark:text-green-400 gap-1 hover:text-green-700" asChild>
                      <Link to="/resources/plugins">
                        <span>See deals</span>
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* NEW SECTION: Upcoming Events */}
        <div className="bg-black/5 dark:bg-white/5 py-8 mb-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">Upcoming Events</h2>
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  <Calendar size={12} className="mr-1" /> New
                </Badge>
              </div>
              <Button variant="ghost" size="sm" className="gap-1" asChild>
                <Link to="/events">
                  <span>All events</span>
                  <ChevronRight size={16} />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video relative">
                  <img 
                    src="/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png" 
                    alt="Beat Battle Lagos"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                    <div>
                      <Badge className="mb-2 bg-red-500 text-white">
                        Live
                      </Badge>
                      <h3 className="text-xl font-bold text-white">Beat Battle Lagos</h3>
                      <p className="text-sm text-white/80">May 15, 2023 - The Shrine, Lagos</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Join the biggest beat battle in Lagos and showcase your production skills. Top prize: ₦500,000
                  </p>
                  <Button size="sm" variant="outline" className="w-full">Register Now</Button>
                </div>
              </div>
              
              <div className="bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video relative">
                  <img 
                    src="/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png" 
                    alt="Production Masterclass"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                    <div>
                      <Badge className="mb-2 bg-blue-500 text-white">
                        Workshop
                      </Badge>
                      <h3 className="text-xl font-bold text-white">Production Masterclass</h3>
                      <p className="text-sm text-white/80">June 3, 2023 - Virtual Event</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Learn advanced production techniques from Grammy-winning producer Metro Boomin in this exclusive online event.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">Reserve Spot</Button>
                </div>
              </div>
              
              <div className="bg-card rounded-lg overflow-hidden border shadow-sm hover:shadow-md transition-all">
                <div className="aspect-video relative">
                  <img 
                    src="/lovable-uploads/1e3e62c4-f6ef-463f-a731-1e7c7224d873.png" 
                    alt="Industry Showcase"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-4">
                    <div>
                      <Badge className="mb-2 bg-green-500 text-white">
                        Networking
                      </Badge>
                      <h3 className="text-xl font-bold text-white">Industry Showcase</h3>
                      <p className="text-sm text-white/80">July 12, 2023 - Abuja</p>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect with artists, labels, and other producers at this exclusive industry networking event.
                  </p>
                  <Button size="sm" variant="outline" className="w-full">Get Invited</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
}
