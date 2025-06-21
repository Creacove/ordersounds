
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLazyBeatImageProps {
  beatId: string;
  fallbackUrl?: string;
}

export function useLazyBeatImage({ beatId, fallbackUrl = '/placeholder.svg' }: UseLazyBeatImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadImage = async () => {
      // Don't load if already loading or if we have a non-placeholder image
      if (isLoading || imageUrl !== fallbackUrl) return;
      
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('beats')
          .select('cover_image')
          .eq('id', beatId)
          .maybeSingle();

        if (fetchError) throw fetchError;
        
        if (isMounted && data?.cover_image) {
          setImageUrl(data.cover_image);
        }
      } catch (err) {
        console.error('Failed to load beat image:', err);
        if (isMounted) {
          setError('Failed to load image');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only load image when component comes into view (intersection observer would be ideal)
    // For now, we'll load after a small delay to prioritize initial page load
    const timer = setTimeout(loadImage, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [beatId, imageUrl, fallbackUrl, isLoading]);

  return { imageUrl, isLoading, error };
}
