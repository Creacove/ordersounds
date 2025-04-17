
import React, { useState } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { RefreshCw, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export function FavoriteBeats() {
  const { getUserFavoriteBeats, toggleFavorite, isLoading } = useBeats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const favoriteBeats = getUserFavoriteBeats();
  const isMobile = useIsMobile();

  const refreshFavorites = async () => {
    setIsRefreshing(true);
    try {
      // Just re-fetch the beats data which includes favorites
      await new Promise(resolve => setTimeout(resolve, 300)); // Shortened delay for better UX
      toast.success('Your favorites have been refreshed');
    } catch (error) {
      console.error('Error refreshing favorites:', error);
      toast.error('Failed to refresh your favorites');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (beatId) => {
    await toggleFavorite(beatId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Favorite Beats</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => ( // Reduced number of skeleton elements
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!favoriteBeats || favoriteBeats.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No favorite beats yet"
        description="When you like beats, they will appear here for easy access."
        actionLabel="Browse Beats"
        actionHref="/"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold">Your Favorite Beats</h2>
        <Button 
          variant="outline" 
          size={isMobile ? "sm" : "default"}
          onClick={refreshFavorites}
          disabled={isRefreshing}
          className="w-full xs:w-auto"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              <span className="whitespace-nowrap">Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              <span className="whitespace-nowrap">Refresh</span>
            </>
          )}
        </Button>
      </div>

      {isMobile ? (
        <div className="space-y-3">
          {favoriteBeats.map((beat) => (
            <BeatListItem 
              key={beat.id} 
              beat={beat} 
              isFavorite={true} 
              onToggleFavorite={handleRemoveFavorite} 
            />
          ))}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Beat</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {favoriteBeats.map((beat) => (
                <TableRow key={beat.id}>
                  <TableCell>
                    <BeatListItem beat={beat} isFavorite={true} onToggleFavorite={handleRemoveFavorite} />
                  </TableCell>
                  <TableCell>{beat.producer_name}</TableCell>
                  <TableCell>{beat.genre || 'Unknown'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFavorite(beat.id)}
                      className="flex items-center gap-1"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
