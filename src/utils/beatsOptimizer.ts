
import { Beat } from '@/types';
import { CACHE_KEYS } from './beatsCacheUtils';

// Maximum time to wait for beats to load (in milliseconds)
export const LOADING_TIMEOUT = 8000;

// Fallback data for when we can't load from API
const MIN_FALLBACK_BEATS = 4;

// Check if the cache has enough data to be usable as fallback
export const hasSufficientCachedData = (): boolean => {
  try {
    const cachedBeatsString = localStorage.getItem(CACHE_KEYS.ALL_BEATS);
    if (!cachedBeatsString) return false;
    
    const cachedBeats = JSON.parse(cachedBeatsString);
    return Array.isArray(cachedBeats) && cachedBeats.length >= MIN_FALLBACK_BEATS;
  } catch (error) {
    console.error('Error checking cache sufficiency:', error);
    return false;
  }
};

// Function to prioritize API requests
export const prioritizeNetworkRequests = (): void => {
  if (typeof navigator === 'undefined') return;
  
  try {
    // Inform the browser which resources are critical
    if ('preconnect' in document.createElement('link') && document.head) {
      const supabaseLink = document.createElement('link');
      supabaseLink.rel = 'preconnect';
      supabaseLink.href = 'https://uoezlwkxhbzajdivrlby.supabase.co';
      document.head.appendChild(supabaseLink);
    }
  } catch (error) {
    console.error('Error in prioritizeNetworkRequests:', error);
  }
};

// Sort beats for better display while still loading
export const getSortedFallbackBeats = (beats: Beat[]): Beat[] => {
  if (!beats || beats.length === 0) return [];
  
  // Clone array to avoid mutation
  const sorted = [...beats];
  
  // First sort by purchase count (popularity) and then by favorites
  return sorted.sort((a, b) => {
    // First prioritize beats with images
    if (a.cover_image_url && !b.cover_image_url) return -1;
    if (!a.cover_image_url && b.cover_image_url) return 1;
    
    // Then by purchase count
    const purchaseDiff = (b.purchase_count || 0) - (a.purchase_count || 0);
    if (purchaseDiff !== 0) return purchaseDiff;
    
    // Then by favorites
    return (b.favorites_count || 0) - (a.favorites_count || 0);
  });
};
