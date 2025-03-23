
import { useState } from "react";
import { Link } from "react-router-dom";
import { Play, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MainLayout } from "@/components/layout/MainLayout";
import { BeatCard } from "@/components/ui/BeatCard";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useBeats } from "@/hooks/useBeats";
import { cn } from "@/lib/utils";

export default function Home() {
  const { featuredBeat, trendingBeats, newBeats, isLoading } = useBeats();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handlePlayFeatured = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <MainLayout>
      <div className="min-h-screen">
        {/* Hero section with featured beat */}
        {featuredBeat && (
          <section className="relative h-[320px] md:h-[400px] overflow-hidden">
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
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                  {featuredBeat.title}
                </h1>
                <div className="text-lg font-medium mb-4 text-foreground/80">
                  {featuredBeat.producer_name}
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  <div className="text-sm text-foreground/60">
                    {featuredBeat.bpm} BPM
                  </div>
                  <div className="text-sm text-foreground/60">
                    •
                  </div>
                  <div className="text-sm text-foreground/60">
                    {featuredBeat.genre}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={handlePlayFeatured} className="gap-2">
                    {isPlaying ? <span>Pause</span> : (
                      <>
                        <Play size={16} className="ml-1" />
                        <span>Listen now</span>
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="gap-2">
                    Add to favourite
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Audio player */}
            {isPlaying && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md">
                <AudioPlayer src={featuredBeat.preview_url} />
              </div>
            )}
          </section>
        )}

        {/* Main content */}
        <div className="container py-8">
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
            <div className="bg-card rounded-lg p-4 mb-6 animate-slide-down">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price Range</label>
                  <select className="w-full rounded-md bg-muted border-border">
                    <option>Any price</option>
                    <option>Under ₦5,000</option>
                    <option>₦5,000 - ₦10,000</option>
                    <option>₦10,000 - ₦15,000</option>
                    <option>Over ₦15,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Genre</label>
                  <select className="w-full rounded-md bg-muted border-border">
                    <option>All genres</option>
                    <option>Afrobeat</option>
                    <option>Amapiano</option>
                    <option>Hip Hop</option>
                    <option>R&B</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Track Type</label>
                  <select className="w-full rounded-md bg-muted border-border">
                    <option>All types</option>
                    <option>Single</option>
                    <option>Mix</option>
                    <option>Loop</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <select className="w-full rounded-md bg-muted border-border">
                    <option>Most Popular</option>
                    <option>Newest</option>
                    <option>Price: Low to High</option>
                    <option>Price: High to Low</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <Button size="sm">Apply Filters</Button>
              </div>
            </div>
          )}

          {/* Trending Beats Section */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Trending Beats</h2>
              <Link to="/trending" className="text-sm text-primary hover:underline">
                Show all
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
              <h2 className="text-lg font-semibold">New Beats</h2>
              <Link to="/new" className="text-sm text-primary hover:underline">
                Show all
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
    </MainLayout>
  );
}
