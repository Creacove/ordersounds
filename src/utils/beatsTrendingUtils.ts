
import { Beat } from '@/types';

// Function to refresh trending beats with randomization - no caching needed with React Query
export const refreshTrendingBeats = (allBeats: Beat[]): Beat[] => {
  console.log('Refreshing trending beats - handled by React Query cache');

  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  // Completely randomize the order of beats to maximize variety
  const shuffled = [...allBeats].sort(() => Math.random() - 0.5);

  // Sort by engagement + randomness for trending
  const sortedByTrending = shuffled.sort((a, b) => {
    const randomFactorA = 0.5 + Math.random();
    const randomFactorB = 0.5 + Math.random();

    const scoreA = (
      (b.favorites_count * randomFactorA) +
      (b.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    const scoreB = (
      (a.favorites_count * randomFactorA) +
      (a.purchase_count * 2 * randomFactorB) +
      (Math.random() * 10)
    );

    return scoreA - scoreB;
  });

  // Return top 15 trending beats
  return sortedByTrending.slice(0, 15);
};

export const refreshWeeklyPicks = (allBeats: Beat[]): Beat[] => {
  if (!allBeats || allBeats.length === 0) {
    return [];
  }

  const shuffled = [...allBeats].sort(() => 0.5 - Math.random());
  // Return 6 weekly picks
  return shuffled.slice(0, 6);
};

export const selectFeaturedBeat = (beats: Beat[]): Beat | null => {
  if (!beats || beats.length === 0) {
    return null;
  }

  const shuffled = [...beats].sort(() => 0.5 - Math.random());
  const randomIndex = Math.floor(Math.random() * Math.min(10, shuffled.length));
  const featured = shuffled[randomIndex];
  return featured ? { ...featured, is_featured: true } : null;
};
