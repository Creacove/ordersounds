
import { useState, useMemo } from 'react';
import { Beat } from '@/types';
import { FilterValues } from '@/components/filter/BeatFilters';
import { applyFilters } from '@/utils/beatsFilterUtils';

export function useBeatFilters(beats: Beat[]) {
  const [activeFilters, setActiveFilters] = useState<FilterValues | null>(null);

  const filteredBeats = useMemo(() => {
    if (!activeFilters) {
      return beats;
    }
    return applyFilters(beats, activeFilters);
  }, [beats, activeFilters]);

  const updateFilters = (newFilters: FilterValues) => {
    setActiveFilters(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters(null);
  };

  return {
    filteredBeats,
    activeFilters,
    updateFilters,
    clearFilters
  };
}
