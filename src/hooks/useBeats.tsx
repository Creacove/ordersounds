import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [popularBeats, setPopularBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, currency } = useAuth();
  const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);
  const [filteredBeats, setFilteredBeats] = useState<Beat[]>([]);

  const fetchBeats = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: beatsData, error: beatsError } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
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
        .eq('status', 'published');
      
      if (beatsError) {
        throw beatsError;
      }

      if (beatsData) {
        const transformedBeats: Beat[] = beatsData.map(beat => {
          const userData = beat.users;
          const producerName = userData && userData.stage_name ? userData.stage_name : 
                              userData && userData.full_name ? userData.full_name : 'Unknown Producer';
          
          const status = beat.status === 'published' ? 'published' : 'draft';
          
          return {
            id: beat.id,
            title: beat.title,
            producer_id: beat.producer_id,
            producer_name: producerName,
            cover_image_url: beat.cover_image,
            preview_url: beat.audio_preview,
            full_track_url: beat.audio_file,
            basic_license_price_local: beat.basic_license_price_local,
            basic_license_price_diaspora: beat.basic_license_price_diaspora,
            premium_license_price_local: beat.premium_license_price_local,
            premium_license_price_diaspora: beat.premium_license_price_diaspora,
            exclusive_license_price_local: beat.exclusive_license_price_local,
            exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
            custom_license_price_local: beat.custom_license_price_local,
            custom_license_price_diaspora: beat.custom_license_price_diaspora,
            genre: beat.genre,
            track_type: beat.track_type,
            bpm: beat.bpm,
            tags: beat.tags || [],
            description: beat.description,
            created_at: beat.upload_date,
            favorites_count: beat.favorites_count,
            purchase_count: beat.purchase_count,
            status: status,
            is_featured: false,
          };
        });
        
        setBeats(transformedBeats);
        
        const sortedByTrending = [...transformedBeats].sort((a, b) => b.favorites_count - a.favorites_count);
        setTrendingBeats(sortedByTrending.slice(0, 6));
        
        const sortedByPopular = [...transformedBeats].sort((a, b) => b.purchase_count - a.purchase_count);
        setPopularBeats(sortedByPopular.slice(0, 6));
        
        const sortedByNew = [...transformedBeats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewBeats(sortedByNew);
        
        if (sortedByTrending.length > 0) {
          const featured = sortedByTrending[0];
          setFeaturedBeat({...featured, is_featured: true});
        }
        
        if (activeFilters) {
          applyFilters(transformedBeats, activeFilters);
        } else {
          setFilteredBeats(transformedBeats);
        }
      }
      
      if (user) {
        await fetchUserFavorites();
        await fetchPurchasedBeats();
      }
    } catch (error) {
      console.error('Error fetching beats:', error);
      toast.error('Failed to load beats');
    } finally {
      setIsLoading(false);
    }
  }, [user, activeFilters]);

  const fetchTrendingBeats = useCallback(async () => {
    if (trendingBeats.length > 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
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
        .eq('status', 'published')
        .order('favorites_count', { ascending: false })
        .limit(6);
      
      if (error) {
        throw error;
      }

      if (data) {
        const transformedBeats: Beat[] = data.map(beat => {
          const userData = beat.users;
          const producerName = userData && userData.stage_name ? userData.stage_name : 
                               userData && userData.full_name ? userData.full_name : 'Unknown Producer';
          
          return {
            id: beat.id,
            title: beat.title,
            producer_id: beat.producer_id,
            producer_name: producerName,
            cover_image_url: beat.cover_image,
            preview_url: beat.audio_preview,
            full_track_url: beat.audio_file,
            basic_license_price_local: beat.basic_license_price_local,
            basic_license_price_diaspora: beat.basic_license_price_diaspora,
            premium_license_price_local: beat.premium_license_price_local,
            premium_license_price_diaspora: beat.premium_license_price_diaspora,
            exclusive_license_price_local: beat.exclusive_license_price_local,
            exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
            custom_license_price_local: beat.custom_license_price_local,
            custom_license_price_diaspora: beat.custom_license_price_diaspora,
            genre: beat.genre,
            track_type: beat.track_type,
            bpm: beat.bpm,
            tags: beat.tags || [],
            description: beat.description,
            created_at: beat.upload_date,
            favorites_count: beat.favorites_count,
            purchase_count: beat.purchase_count,
            status: beat.status === 'published' ? 'published' : 'draft',
            is_featured: false,
          };
        });
        
        setTrendingBeats(transformedBeats);
      }
    } catch (error) {
      console.error('Error fetching trending beats:', error);
      toast.error('Failed to load trending beats');
    } finally {
      setIsLoading(false);
    }
  }, [trendingBeats.length]);

  const fetchPopularBeats = useCallback(async () => {
    if (popularBeats.length > 0) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id,
          title,
          producer_id,
          users (
            full_name,
            stage_name
          ),
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
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
        .eq('status', 'published')
        .order('purchase_count', { ascending: false })
        .limit(6);
      
      if (error) {
        throw error;
      }

      if (data) {
        const transformedBeats: Beat[] = data.map(beat => {
          const userData = beat.users;
          const producerName = userData && userData.stage_name ? userData.stage_name : 
                               userData && userData.full_name ? userData.full_name : 'Unknown Producer';
          
          return {
            id: beat.id,
            title: beat.title,
            producer_id: beat.producer_id,
            producer_name: producerName,
            cover_image_url: beat.cover_image,
            preview_url: beat.audio_preview,
            full_track_url: beat.audio_file,
            basic_license_price_local: beat.basic_license_price_local,
            basic_license_price_diaspora: beat.basic_license_price_diaspora,
            premium_license_price_local: beat.premium_license_price_local,
            premium_license_price_diaspora: beat.premium_license_price_diaspora,
            exclusive_license_price_local: beat.exclusive_license_price_local,
            exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
            custom_license_price_local: beat.custom_license_price_local,
            custom_license_price_diaspora: beat.custom_license_price_diaspora,
            genre: beat.genre,
            track_type: beat.track_type,
            bpm: beat.bpm,
            tags: beat.tags || [],
            description: beat.description,
            created_at: beat.upload_date,
            favorites_count: beat.favorites_count,
            purchase_count: beat.purchase_count,
            status: beat.status === 'published' ? 'published' : 'draft',
            is_featured: false,
          };
        });
        
        setPopularBeats(transformedBeats);
      }
    } catch (error) {
      console.error('Error fetching popular beats:', error);
      toast.error('Failed to load popular beats');
    } finally {
      setIsLoading(false);
    }
  }, [popularBeats.length]);

  const fetchUserFavorites = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorites')
        .eq('id', user!.id)
        .single();
      
      if (!userError && userData) {
        let favorites: string[] = [];
        
        if (userData.favorites) {
          if (Array.isArray(userData.favorites)) {
            favorites = userData.favorites as string[];
          } else if (typeof userData.favorites === 'object') {
            const favArray = Array.isArray(userData.favorites) 
              ? userData.favorites 
              : Object.values(userData.favorites || {});
            
            favorites = favArray.filter(id => typeof id === 'string') as string[];
          }
        }
        
        setUserFavorites(favorites);
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

  const fetchPurchasedBeats = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching purchased beats');
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id);
      
      if (purchasedError) {
        console.error('Error fetching purchased beats:', purchasedError);
        return;
      }
      
      if (purchasedData) {
        const purchasedIds = purchasedData.map(item => item.beat_id);
        setPurchasedBeats(purchasedIds);
        
        console.log('Fetched purchased beats:', purchasedIds);
        
        if (purchasedIds.length > 0 && beats.length === 0) {
          const { data: beatsData, error: beatsError } = await supabase
            .from('beats')
            .select(`
              id,
              title,
              producer_id,
              users (
                full_name,
                stage_name
              ),
              cover_image,
              audio_preview,
              audio_file,
              basic_license_price_local,
              basic_license_price_diaspora,
              premium_license_price_local,
              premium_license_price_diaspora,
              exclusive_license_price_local,
              exclusive_license_price_diaspora,
              custom_license_price_local,
              custom_license_price_diaspora,
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
            .in('id', purchasedIds);
            
          if (beatsError) {
            console.error('Error fetching beat details for purchased beats:', beatsError);
          } else if (beatsData) {
            console.log('Got beat details for purchased beats:', beatsData.length);
            
            const transformedBeats: Beat[] = beatsData.map(beat => {
              const userData = beat.users;
              const producerName = userData && userData.stage_name ? userData.stage_name : 
                                userData && userData.full_name ? userData.full_name : 'Unknown Producer';
              
              return {
                id: beat.id,
                title: beat.title,
                producer_id: beat.producer_id,
                producer_name: producerName,
                cover_image_url: beat.cover_image,
                preview_url: beat.audio_preview,
                full_track_url: beat.audio_file,
                basic_license_price_local: beat.basic_license_price_local,
                basic_license_price_diaspora: beat.basic_license_price_diaspora,
                premium_license_price_local: beat.premium_license_price_local,
                premium_license_price_diaspora: beat.premium_license_price_diaspora,
                exclusive_license_price_local: beat.exclusive_license_price_local,
                exclusive_license_price_diaspora: beat.exclusive_license_price_diaspora,
                custom_license_price_local: beat.custom_license_price_local,
                custom_license_price_diaspora: beat.custom_license_price_diaspora,
                genre: beat.genre,
                track_type: beat.track_type,
                bpm: beat.bpm,
                tags: beat.tags || [],
                description: beat.description,
                created_at: beat.upload_date,
                favorites_count: beat.favorites_count,
                purchase_count: beat.purchase_count,
                status: beat.status === 'published' ? 'published' : 'draft',
                is_featured: false,
              };
            });
            
            if (transformedBeats.length > 0) {
              setBeats(prevBeats => {
                const existingIds = new Set(prevBeats.map(b => b.id));
                const newBeats = transformedBeats.filter(b => !existingIds.has(b.id));
                return [...prevBeats, ...newBeats];
              });
            }
          }
        }
        
        return purchasedIds;
      }
    } catch (error) {
      console.error('Error in fetchPurchasedBeats:', error);
    }
  };

  useEffect(() => {
    fetchBeats();
  }, [fetchBeats]);

  const applyFilters = (beatsToFilter: Beat[], filters: FilterValues) => {
    let filtered = [...beatsToFilter];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(beat => 
        beat.title.toLowerCase().includes(searchLower) ||
        beat.producer_name.toLowerCase().includes(searchLower) ||
        (beat.tags && beat.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    if (filters.genre && filters.genre.length > 0) {
      filtered = filtered.filter(beat => 
        filters.genre.includes(beat.genre)
      );
    }
    
    if (filters.trackType && filters.trackType.length > 0) {
      filtered = filtered.filter(beat => 
        filters.trackType.includes(beat.track_type)
      );
    }
    
    if (filters.bpmRange) {
      filtered = filtered.filter(beat => 
        beat.bpm >= filters.bpmRange[0] && beat.bpm <= filters.bpmRange[1]
      );
    }
    
    if (filters.priceRange) {
      if (currency === 'NGN') {
        filtered = filtered.filter(beat => 
          beat.basic_license_price_local >= filters.priceRange[0] && 
          beat.basic_license_price_local <= filters.priceRange[1]
        );
      } else {
        filtered = filtered.filter(beat => 
          beat.basic_license_price_diaspora >= filters.priceRange[0] && 
          beat.basic_license_price_diaspora <= filters.priceRange[1]
        );
      }
    }
    
    setFilteredBeats(filtered);
  };

  const updateFilters = (filters: FilterValues) => {
    setActiveFilters(filters);
    applyFilters(beats, filters);
  };

  const clearFilters = () => {
    setActiveFilters(null);
    setFilteredBeats(beats);
  };

  const toggleFavorite = async (beatId: string) => {
    if (!user) {
      toast.error('Please log in to favorite beats');
      return false;
    }

    try {
      const isFavorite = userFavorites.includes(beatId);
      let newFavorites: string[];
      
      if (isFavorite) {
        newFavorites = userFavorites.filter(id => id !== beatId);
      } else {
        newFavorites = [...userFavorites, beatId];
      }
      
      const { error } = await supabase
        .from('users')
        .update({ favorites: newFavorites })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      const countUpdate = isFavorite ? -1 : 1;
      if (countUpdate > 0) {
        await supabase.rpc("increment_counter", {
          p_table_name: "beats",
          p_column_name: "favorites_count",
          p_id: beatId
        });
      } else {
        const { data: beatData } = await supabase
          .from('beats')
          .select('favorites_count')
          .eq('id', beatId)
          .single();
          
        if (beatData && beatData.favorites_count > 0) {
          await supabase
            .from('beats')
            .update({ favorites_count: Math.max(0, beatData.favorites_count - 1) })
            .eq('id', beatId);
        }
      }
      
      setUserFavorites(newFavorites);
      
      const updatedBeats = beats.map(beat => 
        beat.id === beatId 
          ? { 
              ...beat, 
              favorites_count: isFavorite 
                ? Math.max(0, beat.favorites_count - 1)
                : beat.favorites_count + 1 
            } 
          : beat
      );
      setBeats(updatedBeats);
      
      if (activeFilters) {
        applyFilters(updatedBeats, activeFilters);
      } else {
        setFilteredBeats(updatedBeats);
      }
      
      toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      return !isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
      return false;
    }
  };

  const getBeatById = async (beatId: string): Promise<Beat | null> => {
    try {
      const { data, error } = await supabase
        .from('beats')
        .select(`
          id, 
          title, 
          producer_id,
          cover_image,
          audio_preview,
          audio_file,
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
          genre,
          track_type,
          bpm,
          key,
          tags,
          description,
          upload_date,
          favorites_count,
          purchase_count,
          plays,
          status,
          license_type,
          license_terms,
          users (full_name, stage_name)
        `)
        .eq('id', beatId)
        .single();

      if (error) {
        console.error('Error fetching beat:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      const userData = data.users;
      const producerName = userData && userData.stage_name ? userData.stage_name : 
                            userData && userData.full_name ? userData.full_name : 'Unknown Producer';

      const beat: Beat = {
        id: data.id,
        title: data.title,
        producer_id: data.producer_id,
        producer_name: producerName,
        cover_image_url: data.cover_image,
        preview_url: data.audio_preview,
        full_track_url: data.audio_file,
        basic_license_price_local: data.basic_license_price_local,
        basic_license_price_diaspora: data.basic_license_price_diaspora,
        premium_license_price_local: data.premium_license_price_local,
        premium_license_price_diaspora: data.premium_license_price_diaspora,
        exclusive_license_price_local: data.exclusive_license_price_local,
        exclusive_license_price_diaspora: data.exclusive_license_price_diaspora,
        custom_license_price_local: data.custom_license_price_local,
        custom_license_price_diaspora: data.custom_license_price_diaspora,
        genre: data.genre,
        track_type: data.track_type,
        bpm: data.bpm,
        key: data.key,
        tags: data.tags || [],
        description: data.description,
        created_at: data.upload_date,
        favorites_count: data.favorites_count || 0,
        purchase_count: data.purchase_count || 0,
        plays: data.plays || 0,
        status: data.status as 'draft' | 'published',
        is_featured: false,
        license_type: data.license_type,
        license_terms: data.license_terms
      };

      console.log('Received beat details:', beat);
      return beat;
    } catch (error) {
      console.error('Error in getBeatById:', error);
      return null;
    }
  };

  const getUserFavoriteBeats = () => {
    return beats.filter(beat => userFavorites.includes(beat.id));
  };

  const getUserPurchasedBeats = () => {
    return beats.filter(beat => purchasedBeats.includes(beat.id));
  };

  const getProducerBeats = (producerId: string) => {
    return beats.filter(beat => beat.producer_id === producerId);
  };

  const searchBeats = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return beats.filter(beat => 
      beat.title.toLowerCase().includes(lowerQuery) ||
      beat.producer_name.toLowerCase().includes(lowerQuery) ||
      beat.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  return {
    beats,
    trendingBeats,
    newBeats,
    popularBeats,
    featuredBeat,
    userFavorites,
    purchasedBeats,
    isLoading,
    toggleFavorite,
    getBeatById,
    getUserFavoriteBeats,
    getUserPurchasedBeats,
    getProducerBeats,
    searchBeats,
    isFavorite: (beatId: string) => userFavorites.includes(beatId),
    isPurchased: (beatId: string) => purchasedBeats.includes(beatId),
    filteredBeats,
    updateFilters,
    clearFilters,
    hasFilters: !!activeFilters,
    fetchPurchasedBeats,
    fetchTrendingBeats,
    fetchPopularBeats,
    fetchBeats
  };
}
