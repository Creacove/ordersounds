
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Music, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FollowButton } from "@/components/buttons/FollowButton";

interface ProducerData {
  id: string;
  full_name: string;
  stage_name?: string;
  bio?: string;
  country?: string;
  profile_picture?: string;
  follower_count?: number;
}

interface ProducerInfoSectionProps {
  producerId: string;
  producerName: string;
}

export const ProducerInfoSection = ({ producerId, producerName }: ProducerInfoSectionProps) => {
  const [producer, setProducer] = useState<ProducerData | null>(null);
  const [producerBeatsCount, setProducerBeatsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducerData = async () => {
      try {
        // Fetch producer details
        const { data: producerData, error: producerError } = await supabase
          .from('users')
          .select('id, full_name, stage_name, bio, country, profile_picture, follower_count')
          .eq('id', producerId)
          .single();

        if (producerError) throw producerError;

        // Fetch producer beats count
        const { count, error: beatsError } = await supabase
          .from('beats')
          .select('id', { count: 'exact' })
          .eq('producer_id', producerId)
          .eq('status', 'published');

        if (beatsError) throw beatsError;

        setProducer(producerData);
        setProducerBeatsCount(count || 0);
      } catch (error) {
        console.error('Error fetching producer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducerData();
  }, [producerId]);

  if (loading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">About the Producer</h2>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-muted h-16 w-16"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!producer) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6">About the Producer</h2>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-shrink-0">
              <Avatar className="w-16 h-16">
                <AvatarImage src={producer.profile_picture} />
                <AvatarFallback>
                  {(producer.stage_name || producer.full_name || producerName)
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-xl font-semibold">
                  {producer.stage_name || producer.full_name || producerName}
                </h3>
                {producer.stage_name && producer.full_name && (
                  <p className="text-muted-foreground">{producer.full_name}</p>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {producer.country && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {producer.country}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Music className="w-4 h-4" />
                  {producerBeatsCount} beats
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {producer.follower_count || 0} followers
                </div>
              </div>
              
              {producer.bio && (
                <p className="text-sm leading-relaxed">{producer.bio}</p>
              )}
              
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link to={`/producer/${producerId}`}>
                    View Profile
                  </Link>
                </Button>
                <FollowButton producerId={producerId} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
