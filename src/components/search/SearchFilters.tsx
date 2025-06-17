
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SearchFiltersProps {
  genres: string[];
  selectedGenre?: string;
  showFilters: boolean;
  onToggleFilters: () => void;
  onGenreSelect: (genre: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

export const SearchFilters = memo(({ 
  genres, 
  selectedGenre, 
  showFilters, 
  onToggleFilters, 
  onGenreSelect,
  onClearFilters,
  activeFiltersCount
}: SearchFiltersProps) => {
  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={onToggleFilters}
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {activeFiltersCount > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClearFilters}
            className="gap-1 text-muted-foreground"
          >
            <X size={14} />
            Clear
          </Button>
        )}
      </div>
      
      {/* Genre Filter Pills */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 flex-nowrap min-w-max">
          {genres.map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              size="sm"
              className="rounded-full whitespace-nowrap transition-all duration-200"
              onClick={() => onGenreSelect(genre)}
            >
              {genre}
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="bg-card rounded-lg p-4 animate-slide-down shadow-sm border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium mb-2 block">Price Range</label>
              <select className="w-full rounded-md bg-muted border-border p-2 text-sm">
                <option>Any price</option>
                <option>Under ₦5,000</option>
                <option>₦5,000 - ₦10,000</option>
                <option>₦10,000 - ₦15,000</option>
                <option>Over ₦15,000</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-2 block">Track Type</label>
              <select className="w-full rounded-md bg-muted border-border p-2 text-sm">
                <option value="">All types</option>
                <option value="Single">Single</option>
                <option value="Album">Album</option>
                <option value="EP">EP</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-2 block">Sort By</label>
              <select className="w-full rounded-md bg-muted border-border p-2 text-sm">
                <option>Most Relevant</option>
                <option>Newest</option>
                <option>Most Popular</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-2 block">BPM Range</label>
              <select className="w-full rounded-md bg-muted border-border p-2 text-sm">
                <option>Any BPM</option>
                <option>80-90 BPM</option>
                <option>90-100 BPM</option>
                <option>100-120 BPM</option>
                <option>120+ BPM</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SearchFilters.displayName = 'SearchFilters';
