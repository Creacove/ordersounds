
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { useBeats } from '@/hooks/useBeats';
import { useAuth } from '@/context/AuthContext';
import { Download, Heart, Music, Play, Pause, User, Globe, AudioWaveform, Star as StarIcon, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Home = () => {
  const navigate = useNavigate();
  const { beats, trendingBeats, newBeats, featuredBeat, toggleFavorite, isFavorite, isPurchased, fetchPurchasedBeats } = useBeats();
  const { user } = useAuth();

  const handlePlay = (beat: any) => {
    console.log('Playing beat:', beat);
  };

  const handleToggleFavorite = (e: React.MouseEvent, beatId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(beatId);
  };

  const featuredProducer = {
    id: "1",
    name: "DJ Mixer",
    image: "/placeholder.svg",
    bio: "Award-winning producer with a unique style",
    country: "Nigeria",
    beatsCount: 124,
    salesCount: 1.2
  };

  const ProducerFeature = ({ producer }: { producer: any }) => (
    <div className="flex flex-col md:flex-row items-center gap-6 bg-card/50 backdrop-blur-sm border rounded-xl p-6 relative overflow-hidden">
      <div 
        className="absolute inset-0 opacity-5 bg-repeat z-0" 
        style={{ 
          backgroundImage: "url('/placeholder.svg')", 
          backgroundSize: "100px" 
        }} 
      />
      <div 
        className="w-32 h-32 rounded-full border-4 border-background shadow-xl relative z-10 flex-shrink-0 overflow-hidden"
      >
        <img src={producer.image || "/placeholder.svg"} alt={producer.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 relative z-10 text-center md:text-left">
        <h3 className="text-xl font-bold mb-1">{producer.name}</h3>
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
          <Badge variant="secondary" className="gap-1 text-xs py-0">
            <StarIcon size={12} className="text-yellow-400" />
            Producer of the Week
          </Badge>
          <Badge variant="outline" className="text-xs">
            {producer.country || 'Unknown Location'}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
          {producer.bio || 'No bio available'}
        </p>
        <div className="flex items-center justify-center md:justify-start gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Music size={14} className="text-primary" />
            <span>{producer.beatsCount || 0} beats</span>
          </div>
          <div className="flex items-center gap-1">
            <Download size={14} className="text-primary" />
            <span>{producer.salesCount || 0}k sales</span>
          </div>
        </div>
      </div>
      <div className="mt-4 md:mt-0">
        <Button
          size="sm"
          className="gap-2 rounded-full"
          onClick={() => navigate(`/producer/${producer.id}`)}
        >
          View Profile
        </Button>
      </div>
    </div>
  );

  return (
    <MainLayout>
      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Featured Beat</SectionTitle>
            <Button variant="link" size="sm" onClick={() => navigate('/trending')}>
              View All
            </Button>
          </div>
          {featuredBeat ? (
            <BeatListItem
              beat={featuredBeat}
              isFavorite={isFavorite(featuredBeat.id)}
              isInCart={isPurchased(featuredBeat.id)}
              onToggleFavorite={(e) => handleToggleFavorite(e, featuredBeat.id)}
              onPlay={() => handlePlay(featuredBeat)}
            />
          ) : (
            <p>Loading featured beat...</p>
          )}
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted">
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>Trending Beats</SectionTitle>
            <Button variant="link" size="sm" onClick={() => navigate('/trending')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingBeats.slice(0, 3).map((beat) => (
              <BeatListItem
                key={beat.id}
                beat={beat}
                isFavorite={isFavorite(beat.id)}
                isInCart={isPurchased(beat.id)}
                onToggleFavorite={(e) => handleToggleFavorite(e, beat.id)}
                onPlay={() => handlePlay(beat)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container">
          <div className="flex justify-between items-center mb-6">
            <SectionTitle>New Beats</SectionTitle>
            <Button variant="link" size="sm" onClick={() => navigate('/new')}>
              View All
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {newBeats.slice(0, 3).map((beat) => (
              <BeatListItem
                key={beat.id}
                beat={beat}
                isFavorite={isFavorite(beat.id)}
                isInCart={isPurchased(beat.id)}
                onToggleFavorite={(e) => handleToggleFavorite(e, beat.id)}
                onPlay={() => handlePlay(beat)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-muted">
        <div className="container">
          <SectionTitle>Producer of the Week</SectionTitle>
          <ProducerFeature producer={featuredProducer} />
        </div>
      </section>
    </MainLayout>
  );
};

export default Home;
