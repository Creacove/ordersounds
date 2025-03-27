import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
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
            price_local: beat.price_local,
            price_diaspora: beat.price_diaspora,
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
        setTrendingBeats(sortedByTrending);
        
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
          beat.price_local >= filters.priceRange[0] && 
          beat.price_local <= filters.priceRange[1]
        );
      } else {
        filtered = filtered.filter(beat => 
          beat.price_diaspora >= filters.priceRange[0] && 
          beat.price_diaspora <= filters.priceRange[1]
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
      
      const updateOperation = isFavorite 
        ? { favorites_count: beats.find(b => b.id === beatId)?.favorites_count! - 1 }
        : { favorites_count: beats.find(b => b.id === beatId)?.favorites_count! + 1 };
        
      const { error: beatError } = await supabase
        .from('beats')
        .update(updateOperation)
        .eq('id', beatId);
        
      if (beatError) {
        throw beatError;
      }
      
      setUserFavorites(newFavorites);
      
      const updatedBeats = beats.map(beat => 
        beat.id === beatId 
          ? { 
              ...beat, 
              favorites_count: isFavorite 
                ? beat.favorites_count - 1 
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
          price_local,
          price_diaspora,
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
          basic_license_price_local,
          basic_license_price_diaspora,
          premium_license_price_local,
          premium_license_price_diaspora,
          exclusive_license_price_local,
          exclusive_license_price_diaspora,
          custom_license_price_local,
          custom_license_price_diaspora,
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
        price_local: data.price_local,
        price_diaspora: data.price_diaspora,
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
        license_terms: data.license_terms,
        basic_license_price_local: data.basic_license_price_local,
        basic_license_price_diaspora: data.basic_license_price_diaspora,
        premium_license_price_local: data.premium_license_price_local,
        premium_license_price_diaspora: data.premium_license_price_diaspora,
        exclusive_license_price_local: data.exclusive_license_price_local,
        exclusive_license_price_diaspora: data.exclusive_license_price_diaspora,
        custom_license_price_local: data.custom_license_price_local,
        custom_license_price_diaspora: data.custom_license_price_diaspora
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
    fetchPurchasedBeats
  };
}
