import { useState, useEffect, useRef } from 'react';
import { MainLayoutWithPlayer } from "@/components/layout/MainLayoutWithPlayer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { BeatCard } from "@/components/marketplace/BeatCard";
import { PlaylistCard } from "@/components/marketplace/PlaylistCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { useCart } from "@/context/CartContext";
import { useBeats } from "@/hooks/useBeats";
import { usePlaylists } from "@/hooks/usePlaylists";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  TrendingUp,
  Flame,
  ListMusic,
  Plus,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Index() {
  const { user } = useAuth();
  const { isPlaying, currentBeat, playBeat } = usePlayer();
  const { addMultipleToCart } = useCart();
  const {
    trendingBeats,
    popularBeats,
    toggleFavorite,
    isFavorite,
    fetchTrendingBeats,
    fetchPopularBeats
  } = useBeats();
  const { playlists, createPlaylist, fetchPlaylists } = usePlaylists();
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const isMobile = useIsMobile();
  const trendingBeatsRef = useRef(null);
  const popularBeatsRef = useRef(null);

  useEffect(() => {
    document.title = "Home | OrderSOUNDS";
    fetchTrendingBeats();
    fetchPopularBeats();
    if (user) {
      fetchPlaylists();
    }
  }, [user, fetchTrendingBeats, fetchPopularBeats, fetchPlaylists]);

  const handleToggleFavorite = async (e: React.MouseEvent, beatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("You must be logged in to add to favorites.");
      return;
    }
    try {
      await toggleFavorite(beatId);
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast.error("Failed to update favorite status.");
    }
  };

  const handlePlayBeat = (beat) => {
    if (currentBeat?.id === beat.id) {
      if (isPlaying) {
        playBeat(null);
      } else {
        playBeat(beat);
      }
    } else {
      playBeat(beat);
    }
  };

  const handleAddToCart = (e: React.MouseEvent, beats) => {
    e.preventDefault();
    e.stopPropagation();
    addMultipleToCart(beats);
    toast.success("Beats added to cart!");
  };

  const handleCreatePlaylistClick = () => {
    setIsCreatingPlaylist(true);
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name cannot be empty.");
      return;
    }
    try {
      await createPlaylist(newPlaylistName);
      setNewPlaylistName("");
      setIsCreatingPlaylist(false);
      toast.success("Playlist created successfully!");
    } catch (error) {
      console.error("Playlist creation failed:", error);
      toast.error("Failed to create playlist.");
    }
  };

  const scrollToSection = (section) => {
    if (section === 'trending' && trendingBeatsRef.current) {
      trendingBeatsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (section === 'popular' && popularBeatsRef.current) {
      popularBeatsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <MainLayoutWithPlayer activeTab="home">
      <section className="container section-spacing">
        <div className="relative overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-20 rounded-xl"></div>
          <div className="relative z-10 p-6 md:p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-4 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-4">
                Discover, Collect, and Create with OrderSOUNDS
              </h1>
              <p className="text-sm md:text-base lg:text-lg text-gray-300 mb-6">
                Explore a vast library of high-quality beats and connect with talented producers.
                Start your musical journey today!
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button size="lg" className="w-full sm:w-auto" onClick={() => scrollToSection('trending')}>
                  Explore Trending Beats
                </Button>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto" onClick={() => scrollToSection('popular')}>
                  Discover Popular Beats
                </Button>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="/images/hero-image.png"
                alt="Hero Image"
                className="max-w-full rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container section-spacing" ref={trendingBeatsRef}>
        <div className="flex justify-between items-center header-spacing">
          <SectionTitle>
            <TrendingUp className="mr-2 inline-block" size={20} />
            Trending Beats
          </SectionTitle>
          <Link to="/marketplace">
            <Button variant="link">
              See All
            </Button>
          </Link>
        </div>
        <div className="responsive-grid-3">
          {trendingBeats && trendingBeats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              isPlaying={isPlaying && currentBeat?.id === beat.id}
              onPlay={() => handlePlayBeat(beat)}
              isFavorite={isFavorite(beat.id)}
              onToggleFavorite={(e) => handleToggleFavorite(e, beat.id)}
            />
          ))}
        </div>
        {trendingBeats && trendingBeats.length > 0 && (
          <Button variant="secondary" className="w-full mt-4" onClick={(e) => handleAddToCart(e, trendingBeats)}>
            <ListMusic className="mr-2" size={16} /> Add All Trending to Cart
          </Button>
        )}
      </section>

      <section className="container section-spacing" ref={popularBeatsRef}>
        <div className="flex justify-between items-center header-spacing">
          <SectionTitle>
            <Flame className="mr-2 inline-block" size={20} />
            Popular Beats
          </SectionTitle>
          <Link to="/marketplace">
            <Button variant="link">
              See All
            </Button>
          </Link>
        </div>
        <div className="responsive-grid-3">
          {popularBeats && popularBeats.map((beat) => (
            <BeatCard
              key={beat.id}
              beat={beat}
              isPlaying={isPlaying && currentBeat?.id === beat.id}
              onPlay={() => handlePlayBeat(beat)}
              isFavorite={isFavorite(beat.id)}
              onToggleFavorite={(e) => handleToggleFavorite(e, beat.id)}
            />
          ))}
        </div>
        {popularBeats && popularBeats.length > 0 && (
          <Button variant="secondary" className="w-full mt-4" onClick={(e) => handleAddToCart(e, popularBeats)}>
            <ListMusic className="mr-2" size={16} /> Add All Popular to Cart
          </Button>
        )}
      </section>

      {user && (
        <section className="container section-spacing">
          <div className="flex justify-between items-center header-spacing">
            <SectionTitle>Your Playlists</SectionTitle>
            <Button variant="secondary" size={isMobile ? "sm" : "default"} onClick={handleCreatePlaylistClick}>
              <Plus className="mr-2" size={16} /> Create Playlist
            </Button>
          </div>

          {isCreatingPlaylist ? (
            <form onSubmit={handleCreatePlaylist} className="mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="flex-1 p-2 border rounded"
                />
                <Button type="submit" size={isMobile ? "sm" : "default"}>Create</Button>
                <Button type="button" variant="ghost" size={isMobile ? "sm" : "default"} onClick={() => setIsCreatingPlaylist(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}

          <div className="mobile-playlists-grid">
            {playlists && playlists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </section>
      )}
    </MainLayoutWithPlayer>
  );
}
