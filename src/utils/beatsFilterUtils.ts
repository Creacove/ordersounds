
import { Beat } from '@/types';
import { FilterValues } from '@/components/filter/BeatFilters';

export const applyFilters = (beats: Beat[], filters: FilterValues): Beat[] => {
  let filtered = [...beats];
  
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
    const currency = localStorage.getItem('currency') === 'NGN' ? 'NGN' : 'USD';
    
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
  
  return filtered;
};
