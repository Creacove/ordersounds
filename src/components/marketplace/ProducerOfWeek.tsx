
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { User, Beat } from "@/types";
import { Button } from "@/components/ui/button";
import { BeatCardCompact } from "@/components/marketplace/BeatCardCompact";
import { useFollows } from '@/hooks/useFollows';
import { useAuth } from '@/context/AuthContext';
import { FollowButton } from '@/components/buttons/FollowButton';

export function ProducerOfWeek() {
  const [producerOfWeek, setProducerOfWeek] = useState<User | null>(null);
  const [producerBeats, setProducerBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { useFollowStatus } = useFollows();
  const { data: isFollowing } = useFollowStatus(producerOfWeek?.id);
  
  useEffect(() => {
    const fetchProducerOfWeek = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_producer_of_week');

        if (error) {
          console.error('Error fetching producer of week:', error);
          return;
        }

        if (data && data.length > 0) {
          const producer: User = {
            id: data[0].id,
            email: data[0].email,
            role: data[0].role as 'buyer' | 'producer',
            name: data[0].full_name || data[0].stage_name || '',
            avatar_url: data[0].profile_picture,
            bio: data[0].bio,
            created_at: data[0].created_date,
            country: data[0].country,
            producer_name: data[0].stage_name,
            updated_at: data[0].created_date,
            default_currency: 'NGN' as 'NGN' | 'USD',
            full_name: data[0].full_name,
            stage_name: data[0].stage_name,
            follower_count: data[0].follower_count
          };
          
          setProducerOfWeek(producer);
          
          // Fetch producer's beats
          if (producer.id) {
            const { data: beatsData, error: beatsError } = await supabase
              .from('beats')
              .select('*')
              .eq('producer_id', producer.id)
              .eq('status', 'published')
              .order('created_at', { ascending: false })
              .limit(4);
              
            if (beatsError) {
              console.error('Error fetching producer beats:', beatsError);
            } else if (beatsData) {
              setProducerBeats(beatsData);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch producer of week:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducerOfWeek();
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-40 bg-gray-700 rounded mb-4"></div>
        <div className="h-60 bg-gray-800 rounded-lg border mb-3"></div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!producerOfWeek) {
    return null;
  }

  const producerName = producerOfWeek.stage_name || producerOfWeek.full_name || producerOfWeek.name;

  return (
    <section className="mb-6 px-0 mx-0">
      <div className="bg-card rounded-lg border overflow-hidden mt-3">
        <div className="relative w-full aspect-video max-h-80 bg-gray-900">
          <img 
            src={producerOfWeek.avatar_url || "/placeholder.svg"} 
            alt={producerName} 
            className="w-full h-full object-cover opacity-75"
          />
          
          <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold text-white uppercase">
                {producerName}
              </h3>
              <div className="flex items-center gap-1 bg-purple-900/70 text-white text-xs px-2 py-1 rounded-full">
                <CheckCircle size={12} />
                <span>Verified</span>
              </div>
            </div>
            
            <p className="text-white/80 text-sm mt-1">
              {producerBeats.length} beats • {producerOfWeek.follower_count || 0} followers
            </p>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-muted-foreground mb-4">
            {producerOfWeek.bio || `Award-winning producer specializing in ${producerBeats[0]?.genre || 'beats'}. Worked with top artists across ${producerOfWeek.country || 'the world'} and beyond.`}
          </p>
          
          <FollowButton 
            producerId={producerOfWeek.id} 
            initialFollowState={isFollowing}
            className="w-full"
          />
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2">
        {producerBeats.length > 0 ? (
          producerBeats.map((beat) => (
            <BeatCardCompact key={beat.id} beat={beat} />
          ))
        ) : (
          <div className="col-span-full flex items-center justify-center h-full bg-card rounded-lg border p-4">
            <p className="text-muted-foreground">No beats available from this producer yet.</p>
          </div>
        )}
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/producer/${producerOfWeek.id}`}>
            View all beats by {producerName}
          </Link>
        </Button>
      </div>
    </section>
  );
}
