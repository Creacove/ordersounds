
import { useState } from 'react';
import { useFollows } from '@/hooks/useFollows';
import { BeatCard } from '@/components/marketplace/BeatCard';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/library/EmptyState';

export function RecommendedBeats() {
  const { user } = useAuth();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeats, isLoading } = useRecommendedBeats();
  const [viewAll, setViewAll] = useState(false);
  
  // If not logged in, don't show anything
  if (!user) {
    return null;
  }
  
  // Show a loading skeleton while fetching
  if (isLoading) {
    return (
      <div className="my-8">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  
  // If no recommended beats, don't show the section
  if (!recommendedBeats || recommendedBeats.length === 0) {
    return (
      <div className="my-8">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        <EmptyState
          icon={Sparkles}
          title="No recommendations yet"
          description="Follow producers to get personalized beat recommendations"
          actionLabel="Discover Producers"
          actionHref="/producers"
        />
      </div>
    );
  }
  
  // Determine how many beats to show
  const beatsToShow = viewAll ? recommendedBeats : recommendedBeats.slice(0, 5);
  
  return (
    <div className="my-8">
      <div className="flex justify-between items-center">
        <SectionTitle 
          title="Recommended for You" 
          icon={<Sparkles className="text-yellow-500 h-5 w-5" />}
        />
        {recommendedBeats.length > 5 && (
          <Button 
            variant="ghost" 
            onClick={() => setViewAll(!viewAll)}
            className="text-sm"
          >
            {viewAll ? 'Show Less' : 'View All'}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-4">
        {beatsToShow.map((beat) => (
          <BeatCard 
            key={beat.id} 
            beat={{
              id: beat.id,
              title: beat.title,
              producer_id: beat.producer_id,
              producer_name: beat.users?.stage_name || beat.users?.full_name || "Unknown Producer",
              cover_image_url: beat.cover_image,
              basic_license_price_local: beat.basic_license_price_local,
              genre: '',
              created_at: '',
              preview_url: '',
              full_track_url: ''
            }} 
          />
        ))}
      </div>
      
      {recommendedBeats.length > 5 && viewAll && (
        <div className="flex justify-center mt-6">
          <Button 
            variant="outline" 
            onClick={() => setViewAll(false)}
          >
            Show Less
          </Button>
        </div>
      )}
    </div>
  );
}
