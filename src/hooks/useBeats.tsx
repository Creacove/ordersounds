import { useState, useEffect, useCallback } from 'react';
import { Beat } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FilterValues } from '@/components/filter/BeatFilters';

// Default fallback beats for when we can't load from the API
const fallbackBeats: Beat[] = [
  {
    id: "fallback-1",
    title: "Demo Beat 1",
    producer_id: "demo-producer",
    producer_name: "Demo Producer",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 5000,
    basic_license_price_diaspora: 15,
    genre: "Afrobeat",
    bpm: 120,
    status: "published",
    is_featured: false,
    created_at: new Date().toISOString(),
    tags: ["demo", "afrobeat"]
  },
  {
    id: "fallback-2",
    title: "Demo Beat 2",
    producer_id: "demo-producer",
    producer_name: "Demo Producer",
    cover_image_url: "/placeholder.svg",
    preview_url: "",
    full_track_url: "",
    basic_license_price_local: 7000,
    basic_license_price_diaspora: 20,
    genre: "Hip Hop",
    bpm: 90,
    status: "published",
    is_featured: false,
    created_at: new Date().toISOString(),
    tags: ["demo", "hiphop"]
  }
];

// Utility function to get a cache expiration timestamp
const getCacheExpiration = (intervalHours: number) => {
  const date = new Date();
  date.setHours(date.getHours() + intervalHours);
  return date.getTime();
};

// Local storage keys
const CACHE_KEYS = {
  TRENDING_BEATS: 'trending_beats_cache',
  FEATURED_BEATS: 'featured_beats_cache',
  WEEKLY_PICKS: 'weekly_picks_cache',
  ALL_BEATS: 'all_beats_cache',
  TRENDING_EXPIRY: 'trending_beats_expiry',
  FEATURED_EXPIRY: 'featured_beats_expiry',
  WEEKLY_EXPIRY: 'weekly_picks_expiry',
  ALL_BEATS_EXPIRY: 'all_beats_expiry',
  LAST_TRENDING_REFRESH: 'last_trending_refresh'
};

// Check if we're online
const isOnline = (): boolean => {
  return navigator.onLine;
};

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [popularBeats, setPopularBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const { user, currency } = useAuth();
  const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);
  const [filteredBeats, setFilteredBeats] = useState<Beat[]>([]);
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [retryCount, setRetryCount] = useState(0);
  
  const [weeklyPicks, setWeeklyPicks] = useState<Beat[]>([]);

  // Cache expiration durations (in hours)
  const CACHE_DURATIONS = {
    TRENDING: 1,   // 1 hour for trending beats
    FEATURED: 3,   // 3 hours for featured beats
    WEEKLY: 168,   // Weekly (7 days * 24 hours)
    ALL_BEATS: 24  // 24 hours for all beats
  };

  // Load beats from local storage cache
  const loadFromCache = (cacheKey: string): any[] | null => {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        console.log(`Loading ${cacheKey} from cache`);
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error(`Error loading from cache (${cacheKey}):`, error);
      return null;
    }
  };

  // Save beats to local storage cache
  const saveToCache = (cacheKey: string, data: any, expiryKey: string, durationHours: number): void => {
    try {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      localStorage.setItem(expiryKey, String(getCacheExpiration(durationHours)));
      console.log(`Saved ${cacheKey} to cache, expires in ${durationHours} hours`);
    } catch (error) {
      console.error(`Error saving to cache (${cacheKey}):`, error);
    }
  };

  // Load fallback data when offline or in case of errors
  const loadFallbackData = () => {
    console.log('Loading fallback data');
    
    // Use cached data if available
    const cachedBeats = loadFromCache(CACHE_KEYS.ALL_BEATS) || fallbackBeats;
    const cachedTrending = loadFromCache(CACHE_KEYS.TRENDING_BEATS) || fallbackBeats;
    const cachedFeatured = loadFromCache(CACHE_KEYS.FEATURED_BEATS) || fallbackBeats[0];
    const cachedWeekly = loadFromCache(CACHE_KEYS.WEEKLY_PICKS) || fallbackBeats;
    
    setBeats(cachedBeats);
    setTrendingBeats(cachedTrending);
    setNewBeats(cachedBeats);
    setFeaturedBeat(cachedFeatured);
    setWeeklyPicks(cachedWeekly);
    
    // Log price data for debugging
    fallbackBeats.forEach(beat => {
      console.log('Beat pricing data:', {
        beatId: beat.id,
        beatTitle: beat.title,
        basic_local: beat.basic_license_price_local,
        basic_diaspora: beat.basic_license_price_diaspora,
        calculatedLocal: beat.basic_license_price_local || 0,
        calculatedDiaspora: beat.basic_license_price_diaspora || 0
      });
    });
    
    setIsLoading(false);
    setLoadingError('Could not load beats from server. Using cached or demo content.');
  };

  // Function to check network status
  const checkNetworkAndRetry = async () => {
    if (!isOnline()) {
      setIsOffline(true);
      loadFallbackData();
      return false;
    }
    
    setIsOffline(false);
    return true;
  };
  
  const fetchBeats = useCallback(async () => {
    setIsLoading(true);
    setLoadingError(null);
    
    // Check network status before attempting fetch
    if (!await checkNetworkAndRetry()) {
      return;
    }
    
    console.log('Fetching beats from API...');
    
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
        
        // Save all beats to cache
        saveToCache(CACHE_KEYS.ALL_BEATS, transformedBeats, CACHE_KEYS.ALL_BEATS_EXPIRY, CACHE_DURATIONS.ALL_BEATS);
        
        setBeats(transformedBeats);
        
        // Check if trending beats need to be refreshed
        const shouldRefreshTrending = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
        if (shouldRefreshTrending) {
          refreshTrendingBeats(transformedBeats);
        } else {
          // Try to load from cache
          const cachedTrending = loadFromCache(CACHE_KEYS.TRENDING_BEATS);
          if (cachedTrending) {
            setTrendingBeats(cachedTrending);
          } else {
            refreshTrendingBeats(transformedBeats);
          }
        }
        
        // Refresh featured beats based on cache expiration
        const shouldRefreshFeatured = checkShouldRefreshCache(CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
        if (shouldRefreshFeatured) {
          // Process trending beats first for featured selection
          const shuffled = [...transformedBeats].sort(() => 0.5 - Math.random());
          // Then sort by favorites count with a small random factor
          const sortedByTrending = shuffled
            .sort((a, b) => (b.favorites_count * (0.9 + Math.random() * 0.2)) - 
                          (a.favorites_count * (0.9 + Math.random() * 0.2)));
                          
          if (sortedByTrending.length > 0) {
            // Randomly select a featured beat from top trending
            const randomIndex = Math.floor(Math.random() * Math.min(10, sortedByTrending.length));
            const featured = sortedByTrending[randomIndex];
            const newFeatured = {...featured, is_featured: true};
            setFeaturedBeat(newFeatured);
            saveToCache(CACHE_KEYS.FEATURED_BEATS, newFeatured, CACHE_KEYS.FEATURED_EXPIRY, CACHE_DURATIONS.FEATURED);
          } else {
            // If no beats available, use fallback beat
            setFeaturedBeat(fallbackBeats[0]);
          }
        } else {
          // Try to load from cache
          const cachedFeatured = loadFromCache(CACHE_KEYS.FEATURED_BEATS);
          if (cachedFeatured) {
            setFeaturedBeat(cachedFeatured);
          } else if (trendingBeats.length > 0) {
            const featured = trendingBeats[0];
            setFeaturedBeat({...featured, is_featured: true});
          } else {
            // Fallback
            setFeaturedBeat(fallbackBeats[0]);
          }
        }
        
        // Refresh weekly picks based on cache expiration
        const shouldRefreshWeekly = checkShouldRefreshCache(CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
        if (shouldRefreshWeekly) {
          refreshWeeklyPicks(transformedBeats);
        } else {
          // Try to load from cache
          const cachedWeekly = loadFromCache(CACHE_KEYS.WEEKLY_PICKS);
          if (cachedWeekly) {
            setWeeklyPicks(cachedWeekly);
          } else {
            refreshWeeklyPicks(transformedBeats);
          }
        }
        
        // Sort new beats by creation date
        const sortedByNew = [...transformedBeats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewBeats(sortedByNew);
        
        if (activeFilters) {
          applyFilters(transformedBeats, activeFilters);
        } else {
          setFilteredBeats(transformedBeats);
        }
        
        // Reset loading and error states
        setIsLoading(false);
        setLoadingError(null);
        setRetryCount(0);
        setIsOffline(false);
      }
      
      if (user) {
        await fetchUserFavorites();
        await fetchPurchasedBeats();
      }
    } catch (error) {
      console.error('Error fetching beats:', error);
      
      // Try to retry a few times before falling back to cached data
      if (retryCount < 3) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => fetchBeats(), 1000 * retryCount); // Increasing backoff
        return;
      }
      
      loadFallbackData();
      setLoadingError('Failed to load beats');
      toast.error('Failed to load beats');
    }
  }, [user, activeFilters, retryCount]);

  // Utility function to check if cache should be refreshed
  const checkShouldRefreshCache = (expiryKey: string, defaultDurationHours: number) => {
    const expiryTime = localStorage.getItem(expiryKey);
    if (!expiryTime) return true;
    
    const currentTime = new Date().getTime();
    return currentTime > parseInt(expiryTime);
  };

  // Function to refresh trending beats with cache updates
  const refreshTrendingBeats = (allBeats: Beat[]) => {
    console.log('Refreshing trending beats - hourly refresh');
    
    if (allBeats.length === 0) {
      setTrendingBeats(fallbackBeats);
      return;
    }
    
    // Completely randomize the order of beats to maximize variety
    const shuffled = [...allBeats].sort(() => Math.random() - 0.5);
    
    // Create a scoring system that considers multiple factors with high randomization
    const sortedByTrending = shuffled.sort((a, b) => {
      // Create a unique random seed for each beat to ensure different ordering each time
      const randomFactorA = 0.5 + Math.random(); // 0.5 to 1.5
      const randomFactorB = 0.5 + Math.random(); // 0.5 to 1.5
      
      // Use multiple factors with high randomness to ensure varied ordering
      const scoreA = (
        (b.favorites_count * randomFactorA) + 
        (b.purchase_count * 2 * randomFactorB) + 
        (Math.random() * 10) // Add significant random component
      );
      
      const scoreB = (
        (a.favorites_count * randomFactorA) + 
        (a.purchase_count * 2 * randomFactorB) + 
        (Math.random() * 10) // Add significant random component
      );
      
      return scoreA - scoreB;
    });
    
    // Get trending beats - limiting to 30
    const trending = sortedByTrending.slice(0, 30);
    setTrendingBeats(trending);
    
    // Update cache with timestamp
    saveToCache(CACHE_KEYS.TRENDING_BEATS, trending, CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
    localStorage.setItem(CACHE_KEYS.LAST_TRENDING_REFRESH, new Date().toISOString());
  };

  // Function to refresh weekly picks with cache updates
  const refreshWeeklyPicks = (allBeats: Beat[]) => {
    if (allBeats.length === 0) {
      setWeeklyPicks(fallbackBeats);
      return;
    }
    
    // For weekly picks, select based on a combination of factors
    const shuffled = [...allBeats].sort(() => 0.5 - Math.random());
    // Select beats that have good engagement but aren't necessarily the top ones
    const picks = shuffled
      .filter(beat => beat.favorites_count > 0 || beat.purchase_count > 0)
      .slice(0, 8);
    
    // If we don't have enough beats with engagement, just use some random ones
    if (picks.length < 6) {
      setWeeklyPicks(shuffled.slice(0, 8));
      saveToCache(CACHE_KEYS.WEEKLY_PICKS, shuffled.slice(0, 8), CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
    } else {
      setWeeklyPicks(picks);
      saveToCache(CACHE_KEYS.WEEKLY_PICKS, picks, CACHE_KEYS.WEEKLY_EXPIRY, CACHE_DURATIONS.WEEKLY);
    }
  };

  const fetchTrendingBeats = useCallback(async () => {
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
        .limit(30);
      
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
  }, []);

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
    if (!user) return [];
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('favorites')
        .eq('id', user.id)
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
        return favorites;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  };

  const fetchPurchasedBeats = async () => {
    if (!user) return [];
    
    try {
      console.log('Fetching purchased beats');
      const { data: purchasedData, error: purchasedError } = await supabase
        .from('user_purchased_beats')
        .select('beat_id')
        .eq('user_id', user.id);
      
      if (purchasedError) {
        console.error('Error fetching purchased beats:', purchasedError);
        return [];
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
      return [];
    } catch (error) {
      console.error('Error in fetchPurchasedBeats:', error);
      return [];
    }
  };

  // Set up network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      // Refetch data automatically when we're back online
      fetchBeats();
      toast.success("You're back online!");
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You're offline. Some features may be limited.");
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check immediately on mount
    if (!navigator.onLine) {
      setIsOffline(true);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchBeats();
    
    // Add an interval check to refresh trending beats if needed
    // Check every 5 minutes if the cache has expired
    const intervalId = setInterval(() => {
      const shouldRefresh = checkShouldRefreshCache(CACHE_KEYS.TRENDING_EXPIRY, CACHE_DURATIONS.TRENDING);
      if (shouldRefresh && beats.length > 0) {
        refreshTrendingBeats(beats);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
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

  const updateFilters = (
