
// Re-export all functions from the query service
export * from './queryService';

// Also export other necessary functions from other files
export * from './userService';

// Re-export utility functions
export * from './utils';

// Re-export types
export * from './types';

// Add missing functions that were referenced but not exported
export const fetchRandomBeats = async (limit = 10) => {
  const { fetchAllBeats } = await import('./queryService');
  const allBeats = await fetchAllBeats({ limit: 50 });
  
  // Shuffle and return random beats
  const shuffled = [...allBeats].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

export const clearBeatsCache = () => {
  // Clear relevant localStorage cache keys
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('beats') || key.includes('trending') || key.includes('featured'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('Beats cache cleared');
};
