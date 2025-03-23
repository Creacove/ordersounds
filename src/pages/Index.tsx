
import React from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <MainLayoutWithPlayer>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">Discover Amazing Beats</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Find the perfect beat for your next project from our marketplace of talented producers
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/browse">Browse Beats</Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/trending">
                <Play size={16} />
                <span>Trending Beats</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </MainLayoutWithPlayer>
  );
};

export default Index;
