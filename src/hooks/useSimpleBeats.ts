
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Beat } from '@/types';
import { mapSupabaseBeatToBeat } from '@/services/beats/utils';

export function useSimpleBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBeats = async () => {
      try {
        console.log('🔥 Loading beats directly from Supabase...');
        
        const { data, error } = await supabase
          .from('beats')
          .select(`
            *,
            users!beats_producer_id_fkey (
              full_name,
              stage_name
            )
          `)
          .eq('status', 'published')
          .order('upload_date', { ascending: false })
          .limit(20);

        if (error) {
          console.error('❌ Error loading beats:', error);
          setError(error.message);
          return;
        }

        if (data) {
          const mappedBeats = data.map(mapSupabaseBeatToBeat);
          console.log('✅ Loaded beats:', mappedBeats.length);
          setBeats(mappedBeats);
        }
      } catch (err) {
        console.error('❌ Failed to load beats:', err);
        setError(err instanceof Error ? err.message : 'Failed to load beats');
      } finally {
        setIsLoading(false);
      }
    };

    loadBeats();
  }, []);

  return { beats, isLoading, error };
}
