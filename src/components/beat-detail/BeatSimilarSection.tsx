
import { useState, useEffect } from "react";
import { Heart, ShoppingCart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Beat } from "@/types";
import { mapSupabaseBeatToBeat } from "@/services/beats/utils";
import { SupabaseBeat } from "@/services/beats/types";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

interface BeatSimilarSectionProps {
  currentBeatId: string;
  genre: string;
  producerId: string;
}

export const BeatSimilarSection = ({ currentBeatId, genre, producerId }: BeatSimilarSectionProps) => {
  const [similarBeats, setSimilarBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency } = useAuth();
  const { addToCart, isInCart } = useCart();

  useEffect(() => {
    const fetchSimilarBeats = async () => {
      try {
        const { data: genreBeats, error: genreError } = await supabase
          .from('beats')
          .select(`
            id, title, producer_id, cover_image, audio_preview,
            basic_license_price_local, basic_license_price_diaspora,
            genre, track_type, bpm, tags, upload_date,
            favorites_count, purchase_count, status,
            users (full_name, stage_name)
          `)
          .eq('status', 'published')
          .eq('genre', genre)
          .neq('id', currentBeatId)
          .limit(5);

        if (genreError) throw genreError;

        const mappedBeats = genreBeats?.map(beat => mapSupabaseBeatToBeat(beat as SupabaseBeat)) || [];
        setSimilarBeats(mappedBeats);
      } catch (error) {
        console.error('Error fetching similar beats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarBeats();
  }, [currentBeatId, genre, producerId]);

  const handleAddToCart = (beat: Beat) => {
    const beatWithLicense = {
      ...beat,
      selected_license: 'basic'
    };
    addToCart(beatWithLicense);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Similar Beats</h2>
        <div className="space-y-3">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-800 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (similarBeats.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white">Similar Beats</h2>
      <div className="space-y-3">
        {similarBeats.map((beat) => {
          const price = currency === 'NGN' 
            ? beat.basic_license_price_local || 0
            : beat.basic_license_price_diaspora || 0;
          const inCart = isInCart(beat.id);

          return (
            <div 
              key={beat.id} 
              className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={beat.cover_image_url || "/placeholder.svg"}
                  alt={beat.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{beat.title}</h3>
                <p className="text-gray-400 text-sm truncate">{beat.producer_name}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <Heart className="w-4 h-4" />
                </Button>
                
                <Button 
                  onClick={() => handleAddToCart(beat)}
                  disabled={inCart}
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-gray-700">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
                
                <div className="text-purple-400 font-medium text-sm">
                  Basic: {formatCurrency(price, currency)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
