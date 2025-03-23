
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Filter, ArrowRight, Sparkles, Fire, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { BeatCard } from "@/components/ui/BeatCard";
import { useBeats } from "@/hooks/useBeats";
import { usePlayer } from "@/context/PlayerContext";
import { cn } from "@/lib/utils";

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
    { name: "Hip Hop", icon: <Fire size={16} /> },
    { name: "R&B", icon: <Clock size={16} /> },
    { name: "Amapiano", icon: <Sparkles size={16} /> },
  ];

  return (
    <MainLayoutWithPlayer>
      <div className="min-h-screen">
        {/* Hero section with featured beat */}
        {featuredBeat && (
          <section className="relative h-[320px] md:h-[400px] lg:h-[480px] overflow-hidden">
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
                <div className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium mb-4 animate-pulse-gentle">
                  Featured Beat
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-white">
                  {featuredBeat.title}
                </h1>
                <div className="text-lg font-medium mb-4 text-white/90">
                  {featuredBeat.producer_name}
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
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
                  >
                    {isPlaying ? <span>Pause</span> : (
                      <>
                        <Play size={16} className="ml-1" />
                        <span>Listen now</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm text-white border-white/20 hover:bg-white/20">
                    Add to favourite
                  </Button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Quick category browse section */}
        <div className="container py-6 overflow-hidden">
          <div className="flex overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
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
        <div className="container py-4">
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
                  <Fire size={12} />
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
      </div>
    </MainLayoutWithPlayer>
  );
}
