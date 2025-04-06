
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { BeatCardCompact } from '@/components/marketplace/BeatCardCompact';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useFollows } from '@/hooks/useFollows';

export function RecommendedBeats() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { useRecommendedBeats } = useFollows();
  const { data: recommendedBeats, isLoading } = useRecommendedBeats();
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    // Only show recommendations if we have user and beats
    if (user && recommendedBeats && recommendedBeats.length > 0) {
      setShowRecommendations(true);
    } else {
      setShowRecommendations(false);
    }
  }, [user, recommendedBeats]);

  if (!showRecommendations) {
    return null; // Don't render anything if there are no recommendations
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">From Producers You Follow</h2>
        <Button 
          variant="link" 
          size="sm" 
          className="text-sm font-medium" 
          onClick={() => navigate('/producers')}
        >
          View All Producers
        </Button>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {recommendedBeats?.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))}
        </div>
      )}
    </div>
  );
}
