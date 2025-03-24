
import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Constants
const GENRES = [
  'Afrobeats', 'Amapiano', 'Hip Hop', 'Trap', 'R&B', 
  'Pop', 'Dance', 'Reggae', 'Gospel', 'Highlife'
];

const TRACK_TYPES = [
  'Club', 'Radio', 'Chill', 'Melodic', 'Upbeat', 
  'Dark', 'Drill', 'Experimental'
];

export interface FilterValues {
  search: string;
  genre: string[];
  trackType: string[];
  bpmRange: [number, number];
  priceRange: [number, number];
}

interface BeatFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  clearFilters: () => void;
  initialFilters?: Partial<FilterValues>;
}

export function BeatFilters({ 
  onFilterChange, 
  clearFilters,
  initialFilters 
}: BeatFiltersProps) {
  const { currency } = useAuth();
  
  // Set default price ranges based on currency
  const getDefaultPriceRange = (curr: 'NGN' | 'USD'): [number, number] => {
    return curr === 'NGN' ? [1000, 30000] : [10, 200];
  };
  
  // Filter state
  const [search, setSearch] = useState(initialFilters?.search || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialFilters?.genre || []);
  const [selectedTrackTypes, setSelectedTrackTypes] = useState<string[]>(initialFilters?.trackType || []);
  const [bpmRange, setBpmRange] = useState<[number, number]>(initialFilters?.bpmRange || [70, 180]);
  const [priceRange, setPriceRange] = useState<[number, number]>(
    initialFilters?.priceRange || getDefaultPriceRange(currency)
  );
  const [isFilterVisible, setIsFilterVisible] = useState(true);
  
  // Handle price range based on currency
  useEffect(() => {
    // Reset price range when currency changes if not already customized
    const defaultRange = getDefaultPriceRange(currency);
    setPriceRange(defaultRange);
  }, [currency]);
  
  // Apply filters
  useEffect(() => {
    onFilterChange({
      search,
      genre: selectedGenres,
      trackType: selectedTrackTypes,
      bpmRange,
      priceRange
    });
  }, [search, selectedGenres, selectedTrackTypes, bpmRange, priceRange]);
  
  const handleClearFilters = () => {
    setSearch('');
    setSelectedGenres([]);
    setSelectedTrackTypes([]);
    setBpmRange([70, 180]);
    setPriceRange(getDefaultPriceRange(currency));
    clearFilters();
  };
  
  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };
  
  const toggleTrackType = (type: string) => {
    if (selectedTrackTypes.includes(type)) {
      setSelectedTrackTypes(selectedTrackTypes.filter(t => t !== type));
    } else {
      setSelectedTrackTypes([...selectedTrackTypes, type]);
    }
  };
  
  const priceConfig = {
    min: currency === 'NGN' ? 500 : 5,
    max: currency === 'NGN' ? 50000 : 300,
    step: currency === 'NGN' ? 500 : 5,
    symbol: currency === 'NGN' ? '₦' : '$'
  };
  
  const formatPrice = (price: number) => {
    return `${priceConfig.symbol}${price.toLocaleString()}`;
  };
  
  const hasActiveFilters = 
    search !== '' || 
    selectedGenres.length > 0 || 
    selectedTrackTypes.length > 0 || 
    bpmRange[0] !== 70 || 
    bpmRange[1] !== 180 ||
    (currency === 'NGN' && (priceRange[0] !== 1000 || priceRange[1] !== 30000)) ||
    (currency === 'USD' && (priceRange[0] !== 10 || priceRange[1] !== 200));
  
  return (
    <div className="bg-card rounded-lg border border-border mb-6">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h3 className="font-medium">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1 h-8"
          onClick={() => setIsFilterVisible(!isFilterVisible)}
        >
          <SlidersHorizontal size={14} />
          <span>{isFilterVisible ? 'Hide' : 'Show'}</span>
        </Button>
      </div>
      
      {isFilterVisible && (
        <div className="p-4 space-y-6">
          <div>
            <Label htmlFor="search" className="block mb-2">Search</Label>
            <Input
              id="search"
              placeholder="Search by title, producer, or tags"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md"
            />
          </div>
          
          <div>
            <Label className="block mb-2">Genre</Label>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(genre => (
                <Badge
                  key={genre}
                  variant={selectedGenres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <Label className="block mb-2">Track Type</Label>
            <div className="flex flex-wrap gap-2">
              {TRACK_TYPES.map(type => (
                <Badge
                  key={type}
                  variant={selectedTrackTypes.includes(type) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTrackType(type)}
                >
                  {type}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Label>BPM Range</Label>
              <span className="text-sm text-muted-foreground">
                {bpmRange[0]} - {bpmRange[1]} BPM
              </span>
            </div>
            <Slider
              value={bpmRange}
              min={60}
              max={200}
              step={1}
              onValueChange={(value) => setBpmRange(value as [number, number])}
              className="max-w-md"
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <Label>Price Range ({currency})</Label>
              <span className="text-sm text-muted-foreground">
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </span>
            </div>
            <Slider
              value={priceRange}
              min={priceConfig.min}
              max={priceConfig.max}
              step={priceConfig.step}
              onValueChange={(value) => setPriceRange(value as [number, number])}
              className="max-w-md"
            />
          </div>
          
          {hasActiveFilters && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleClearFilters}
              >
                <X size={14} />
                <span>Clear Filters</span>
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
