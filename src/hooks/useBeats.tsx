
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
      // Fetch all published beats
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
        // Transform data to match Beat type
        const transformedBeats: Beat[] = beatsData.map(beat => {
          // Get the producer data safely
          const userData = beat.users;
          const producerName = userData && userData.stage_name ? userData.stage_name : 
                              userData && userData.full_name ? userData.full_name : 'Unknown Producer';
          
          // Force the status to be either 'draft' or 'published' to satisfy the type
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
        
        // Set trending beats (sorted by favorites_count)
        const sortedByTrending = [...transformedBeats].sort((a, b) => b.favorites_count - a.favorites_count);
        setTrendingBeats(sortedByTrending);
        
        // Set new beats (sorted by created_at)
        const sortedByNew = [...transformedBeats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewBeats(sortedByNew);
        
        // Set featured beat (first trending one for now)
        if (sortedByTrending.length > 0) {
          const featured = sortedByTrending[0];
          setFeaturedBeat({...featured, is_featured: true});
        }
        
        // Apply filters if any are active
        if (activeFilters) {
          applyFilters(transformedBeats, activeFilters);
        } else {
          setFilteredBeats(transformedBeats);
        }
      }
      
      // Fetch user favorites if user is logged in
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
        // Ensure favorites is an array of strings
        try {
          let favorites: string[] = [];
          
          if (userData.favorites) {
            // If it's already an array, use it
            if (Array.isArray(userData.favorites)) {
              favorites = userData.favorites as string[];
            } 
            // If it's a JSON object, extract values
            else if (typeof userData.favorites === 'object') {
              const favArray = Array.isArray(userData.favorites) 
                ? userData.favorites 
                : Object.values(userData.favorites || {});
              
              // Filter to ensure only strings are included
              favorites = favArray.filter(id => typeof id === 'string') as string[];
            }
          }
          
          setUserFavorites(favorites);
        } catch (e) {
          console.error('Error parsing favorites:', e);
          setUserFavorites([]);
        }
      }
    } catch (error) {
      console.error('Error fetching user favorites:', error);
    }
  };

  const fetchPurchasedBeats = async () => {
    try {
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user!.id);
      
      if (!purchasedError && purchasedData) {
        const purchasedIds = purchasedData.map(item => item.beat_id);
        setPurchasedBeats(purchasedIds);
      }
    } catch (error) {
      console.error('Error fetching purchased beats:', error);
    }
  };

  useEffect(() => {
    fetchBeats();
  }, [fetchBeats]);

  // Apply filters to beats
  const applyFilters = (beatsToFilter: Beat[], filters: FilterValues) => {
    let filtered = [...beatsToFilter];
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(beat => 
        beat.title.toLowerCase().includes(searchLower) ||
        beat.producer_name.toLowerCase().includes(searchLower) ||
        (beat.tags && beat.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }
    
    // Apply genre filter
    if (filters.genre && filters.genre.length > 0) {
      filtered = filtered.filter(beat => 
        filters.genre.includes(beat.genre)
      );
    }
    
    // Apply track type filter
    if (filters.trackType && filters.trackType.length > 0) {
      filtered = filtered.filter(beat => 
        filters.trackType.includes(beat.track_type)
      );
    }
    
    // Apply BPM range filter
    if (filters.bpmRange) {
      filtered = filtered.filter(beat => 
        beat.bpm >= filters.bpmRange[0] && beat.bpm <= filters.bpmRange[1]
      );
    }
    
    // Apply price range filter
    if (filters.priceRange) {
      // Filter based on the current currency
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
  
  // Apply filters to current beats
  const updateFilters = (filters: FilterValues) => {
    setActiveFilters(filters);
    applyFilters(beats, filters);
  };
  
  // Clear all filters
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
      // Check if beat is already in favorites
      const isFavorite = userFavorites.includes(beatId);
      let newFavorites: string[];
      
      if (isFavorite) {
        // Remove from favorites
        newFavorites = userFavorites.filter(id => id !== beatId);
      } else {
        // Add to favorites
        newFavorites = [...userFavorites, beatId];
      }
      
      // Update favorites in database
      const { error } = await supabase
        .from('users')
        .update({ favorites: newFavorites })
        .eq('id', user.id);
      
      if (error) {
        throw error;
      }
      
      // Update beat favorites count
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
      
      // Update local state
      setUserFavorites(newFavorites);
      
      // Update beats with new favorite count
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
      
      // Update filtered beats if needed
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

  const getBeatById = (id: string) => {
    return beats.find(beat => beat.id === id) || null;
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
    hasFilters: !!activeFilters
  };
}
