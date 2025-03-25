
import React, { useEffect, useState } from 'react';
import { MainLayoutWithPlayer } from '@/components/layout/MainLayoutWithPlayer';
import { useBeats } from '@/hooks/useBeats';
import { BeatCard } from '@/components/ui/BeatCard';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { PlaylistCard } from '@/components/library/PlaylistCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { FeaturedBeatBanner } from '@/components/ui/FeaturedBeatBanner';
import { Beat } from '@/types';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

export default function Home() {
  const { trendingBeats, newBeats, featuredBeat, isFavorite, toggleFavorite } = useBeats();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [producerOfTheWeek, setProducerOfTheWeek] = useState<{
    id: string;
    name: string;
    avatar_url?: string;
    bio?: string;
    beats: Beat[];
  } | null>(null);

  useEffect(() => {
    // Fetch playlists
    const fetchPlaylists = async () => {
      const { data } = await supabase
        .from('playlists')
        .select('*')
        .eq('is_public', true)
        .limit(6);
      
      setPlaylists(data || []);
    };

    // Fetch producer of the week
    const fetchProducerOfTheWeek = async () => {
      // First get a random producer
      const { data: producerData } = await supabase
        .from('users')
        .select('id, full_name, stage_name, profile_picture, bio')
        .eq('role', 'producer')
        .limit(1);
      
      if (producerData && producerData.length > 0) {
        const producer = producerData[0];
        
        // Then get their beats
        const { data: producerBeats } = await supabase
          .from('beats')
          .select(`
            id, 
            title, 
            producer_id,
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
          .eq('producer_id', producer.id)
          .eq('status', 'published')
          .limit(5);
        
        if (producerBeats) {
          // Transform the beats data to match our Beat type
          const transformedBeats: Beat[] = producerBeats.map(beat => ({
            id: beat.id,
            title: beat.title,
            producer_id: beat.producer_id,
            producer_name: producer.stage_name || producer.full_name,
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
            favorites_count: beat.favorites_count || 0,
            purchase_count: beat.purchase_count || 0,
            status: beat.status as 'draft' | 'published',
            is_featured: false,
          }));
          
          setProducerOfTheWeek({
            id: producer.id,
            name: producer.stage_name || producer.full_name,
            avatar_url: producer.profile_picture,
            bio: producer.bio,
            beats: transformedBeats
          });
        }
      }
    };

    fetchPlaylists();
    fetchProducerOfTheWeek();
  }, []);

  return (
    <MainLayoutWithPlayer>
      <div className="container py-6">
        {/* Hero section with featured beat */}
        {featuredBeat && (
          <div className="mb-10">
            <FeaturedBeatBanner beat={featuredBeat} />
          </div>
        )}
        
        {/* Weekly Picks Carousel */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Weekly Picks</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/trending">View All</Link>
            </Button>
          </div>
          
          <Carousel className="w-full">
            <CarouselContent className="-ml-4">
              {trendingBeats.slice(0, 8).map((beat) => (
                <CarouselItem key={beat.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                  <div className="p-1">
                    <BeatCard
                      beat={beat}
                      isFavorite={isFavorite(beat.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex" />
            <CarouselNext className="hidden sm:flex" />
          </Carousel>
        </div>
        
        {/* New Arrivals Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">New Arrivals</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/new">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {newBeats.slice(0, 6).map((beat) => (
              <BeatCard
                key={beat.id}
                beat={beat}
                isFavorite={isFavorite(beat.id)}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
        
        {/* Playlists Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Playlists</h2>
            <Button variant="outline" size="sm" asChild>
              <Link to="/playlists">View All</Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {playlists.slice(0, 4).map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onClick={() => navigate(`/playlists/${playlist.id}`)}
              />
            ))}
          </div>
        </div>
        
        {/* CTA Section - Different for logged in vs non-logged in users */}
        <div className="my-16 p-8 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg text-center">
          <h2 className="text-3xl font-bold mb-4">
            {user ? "Elevate Your Music Production" : "Join Our Beat Marketplace"}
          </h2>
          <p className="max-w-lg mx-auto mb-6 text-muted-foreground">
            {user 
              ? "Explore thousands of high-quality beats, connect with top producers, and find the perfect sound for your next project."
              : "Sign up today to browse thousands of high-quality beats, save your favorites, and connect with top producers from around the world."
            }
          </p>
          {user ? (
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/trending">Explore Trending Beats</Link>
              </Button>
              {user.role === 'producer' ? (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/producer/upload">Upload Your Beats</Link>
                </Button>
              ) : (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/genres">Browse by Genre</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          )}
        </div>
        
        {/* Producer of the Week */}
        {producerOfTheWeek && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Producer of the Week</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-card rounded-lg border p-5">
              {/* Producer Profile */}
              <div className="md:col-span-1 flex flex-col items-center md:items-start">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-muted mb-4">
                  <img 
                    src={producerOfTheWeek.avatar_url || '/placeholder.svg'} 
                    alt={producerOfTheWeek.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-center md:text-left">{producerOfTheWeek.name}</h3>
                {producerOfTheWeek.bio && (
                  <p className="text-sm text-muted-foreground text-center md:text-left mb-4 line-clamp-3">
                    {producerOfTheWeek.bio}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  className="mt-auto w-full md:w-auto"
                  onClick={() => navigate(`/producer/${producerOfTheWeek.id}`)}
                >
                  View Profile
                </Button>
              </div>
              
              {/* Producer Beats */}
              <div className="md:col-span-4 space-y-2">
                {producerOfTheWeek.beats.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No beats available</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {producerOfTheWeek.beats.map(beat => (
                      <div key={beat.id} onClick={() => navigate(`/beat/${beat.id}`)} className="cursor-pointer">
                        <BeatListItem 
                          beat={beat}
                          isFavorite={isFavorite(beat.id)}
                          onToggleFavorite={toggleFavorite}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayoutWithPlayer>
  );
}
