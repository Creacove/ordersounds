
import { useState, useEffect } from 'react';
import { Beat, FavoriteBeat } from '@/types';
import { useAuth } from '@/context/AuthContext';

// Mock data for beats
const mockBeats: Beat[] = [
  {
    id: '1',
    title: 'Afrobeat 9ja Mix beat',
    producer_id: '2',
    producer_name: 'Heritage beatz',
    cover_image_url: '/lovable-uploads/42048ddf-a40e-48ed-997b-31730be27e54.png',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    full_track_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    price_local: 10000, // NGN
    price_diaspora: 25, // USD
    genre: 'Afrobeat',
    track_type: 'Mix',
    bpm: 105,
    tags: ['afrobeat', 'nigeria', 'dancing'],
    description: 'A vibrant afrobeat mix with classic Nigerian rhythm patterns.',
    created_at: '2023-05-15T10:30:00Z',
    favorites_count: 124,
    purchase_count: 45,
    status: 'published',
    is_featured: true
  },
  {
    id: '2',
    title: 'Lagos Nights',
    producer_id: '2',
    producer_name: 'Heritage beatz',
    cover_image_url: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?q=80&w=2070&auto=format&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    full_track_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    price_local: 8500,
    price_diaspora: 20,
    genre: 'Afrobeat',
    track_type: 'Single',
    bpm: 98,
    tags: ['lagos', 'nightlife', 'chill'],
    created_at: '2023-06-20T14:45:00Z',
    favorites_count: 89,
    purchase_count: 32,
    status: 'published'
  },
  {
    id: '3',
    title: 'Amapiano Fusion',
    producer_id: '3',
    producer_name: 'DJ Maphorisa',
    cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=2070&auto=format&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    full_track_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    price_local: 12000,
    price_diaspora: 30,
    genre: 'Amapiano',
    track_type: 'Mix',
    bpm: 108,
    tags: ['amapiano', 'south africa', 'dance'],
    created_at: '2023-04-10T09:15:00Z',
    favorites_count: 210,
    purchase_count: 85,
    status: 'published'
  },
  {
    id: '4',
    title: 'Highlife Classics',
    producer_id: '4',
    producer_name: 'Kel P',
    cover_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=2070&auto=format&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    full_track_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    price_local: 9500,
    price_diaspora: 22,
    genre: 'Highlife',
    track_type: 'Single',
    bpm: 92,
    tags: ['highlife', 'ghana', 'classic'],
    created_at: '2023-07-05T11:20:00Z',
    favorites_count: 76,
    purchase_count: 28,
    status: 'published'
  },
  {
    id: '5',
    title: 'Afro-House Rhythm',
    producer_id: '5',
    producer_name: 'Kabza De Small',
    cover_image_url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop',
    preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    full_track_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    price_local: 11000,
    price_diaspora: 27,
    genre: 'Afro-House',
    track_type: 'Mix',
    bpm: 120,
    tags: ['afro-house', 'electronic', 'dance'],
    created_at: '2023-03-25T16:50:00Z',
    favorites_count: 145,
    purchase_count: 60,
    status: 'published'
  }
];

// Mock data for user's favorites
const mockFavorites: FavoriteBeat[] = [
  {
    user_id: '1',
    beat_id: '1',
    added_at: '2023-06-15T10:30:00Z'
  },
  {
    user_id: '1',
    beat_id: '3',
    added_at: '2023-07-20T14:45:00Z'
  }
];

// Mock data for purchased beats
const mockPurchasedBeats = [
  {
    user_id: '1',
    beat_id: '2',
    purchased_at: '2023-08-10T09:15:00Z'
  },
  {
    user_id: '1',
    beat_id: '4',
    purchased_at: '2023-09-05T11:20:00Z'
  }
];

export function useBeats() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [trendingBeats, setTrendingBeats] = useState<Beat[]>([]);
  const [newBeats, setNewBeats] = useState<Beat[]>([]);
  const [featuredBeat, setFeaturedBeat] = useState<Beat | null>(null);
  const [userFavorites, setUserFavorites] = useState<string[]>([]);
  const [purchasedBeats, setPurchasedBeats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchBeats = async () => {
      setIsLoading(true);
      try {
        // In a real app, this would fetch from Supabase
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate loading
        
        // Set all beats
        setBeats(mockBeats);
        
        // Set trending beats (sorted by favorites_count)
        const sortedByTrending = [...mockBeats].sort((a, b) => b.favorites_count - a.favorites_count);
        setTrendingBeats(sortedByTrending);
        
        // Set new beats (sorted by created_at)
        const sortedByNew = [...mockBeats].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setNewBeats(sortedByNew);
        
        // Set featured beat
        const featured = mockBeats.find(beat => beat.is_featured);
        setFeaturedBeat(featured || sortedByTrending[0]);
        
        // Set user favorites if user is logged in
        if (user) {
          const favoriteIds = mockFavorites
            .filter(fav => fav.user_id === user.id)
            .map(fav => fav.beat_id);
          setUserFavorites(favoriteIds);
          
          // Set purchased beats
          const purchasedIds = mockPurchasedBeats
            .filter(purchase => purchase.user_id === user.id)
            .map(purchase => purchase.beat_id);
          setPurchasedBeats(purchasedIds);
        }
      } catch (error) {
        console.error('Error fetching beats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeats();
  }, [user]);

  const toggleFavorite = async (beatId: string) => {
    if (!user) {
      return false;
    }

    try {
      // Check if beat is already in favorites
      const isFavorite = userFavorites.includes(beatId);
      
      if (isFavorite) {
        // Remove from favorites
        setUserFavorites(prev => prev.filter(id => id !== beatId));
        // Update beat favorites count
        setBeats(prev => 
          prev.map(beat => 
            beat.id === beatId 
              ? { ...beat, favorites_count: beat.favorites_count - 1 } 
              : beat
          )
        );
      } else {
        // Add to favorites
        setUserFavorites(prev => [...prev, beatId]);
        // Update beat favorites count
        setBeats(prev => 
          prev.map(beat => 
            beat.id === beatId 
              ? { ...beat, favorites_count: beat.favorites_count + 1 } 
              : beat
          )
        );
      }
      
      return !isFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
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

  // Search functionality
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
  };
}
