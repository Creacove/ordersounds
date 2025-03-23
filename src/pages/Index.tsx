
import React from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Play, TrendingUp, Music, ArrowRight, Headphones } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <MainLayoutWithPlayer>
      {/* Hero section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative container mx-auto py-16 px-4 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in">
              Find Perfect Beats for Your Next Project
            </h1>
            <p className="text-xl text-white/90 mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Connect with talented producers and discover unique sounds on Nigeria's premier beat marketplace
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <Button size="lg" className="bg-white text-purple-600 hover:bg-white/90" asChild>
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

      {/* Features section */}
      <div className="container mx-auto py-16 px-4">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Everything You Need for Your Music
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Trending Beats</h3>
            <p className="text-muted-foreground mb-4">
              Discover the hottest beats that are making waves across Nigeria and beyond
            </p>
            <Button variant="link" className="p-0 gap-1" asChild>
              <Link to="/trending">
                <span>Explore trending</span>
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Music className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Diverse Genres</h3>
            <p className="text-muted-foreground mb-4">
              From Afrobeat to Amapiano, find beats across all popular genres to match your style
            </p>
            <Button variant="link" className="p-0 gap-1" asChild>
              <Link to="/genres">
                <span>Browse genres</span>
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>

          <div className="bg-card border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-4">
              <Play className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Instant Preview</h3>
            <p className="text-muted-foreground mb-4">
              Listen to high-quality previews before purchasing, with our seamless audio player
            </p>
            <Button variant="link" className="p-0 gap-1" asChild>
              <Link to="/new">
                <span>New releases</span>
                <ArrowRight size={16} />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-purple-50 dark:bg-purple-950/30 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to find your next beat?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of artists who have found the perfect sound for their projects
          </p>
          <Button size="lg" asChild>
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Index;
