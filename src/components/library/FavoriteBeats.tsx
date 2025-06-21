
import React, { useState, useEffect } from 'react';
import { useBeats } from '@/hooks/useBeats';
import { EmptyState } from './EmptyState';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BeatListItem } from '@/components/ui/BeatListItem';
import { RefreshCw, Heart } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/context/AuthContext';

export function FavoriteBeats() {
  const { user } = useAuth();
  const { getUserFavoriteBeats, toggleFavorite, isLoading, refreshUserFavorites, userFavorites, beats } = useBeats();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const favoriteBeats = getUserFavoriteBeats(beats);
  const isMobile = useIsMobile();

  // Effect to refresh favorites when component mounts
  useEffect(() => {
    const initializeFavorites = async () => {
      if (user?.id) {
        setLocalLoading(true);
        try {
          await refreshUserFavorites();
        } catch (error) {
          console.error('Error refreshing favorites on mount:', error);
        } finally {
          setLocalLoading(false);
        }
      } else {
        setLocalLoading(false);
      }
    };
    
    initializeFavorites();
  }, [user?.id, refreshUserFavorites]);

  // Effect to update local loading when data changes
  useEffect(() => {
    if (userFavorites && beats.length > 0) {
      setLocalLoading(false);
    }
  }, [userFavorites, beats.length]);

  const refreshFavorites = async () => {
    setIsRefreshing(true);
    try {
      await refreshUserFavorites();
      toast.success('Your favorites have been refreshed');
    } catch (error) {
      console.error('FavoriteBeats: Error refreshing favorites:', error);
      toast.error('Failed to refresh your favorites');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemoveFavorite = async (beatId: string) => {
    try {
      await toggleFavorite(beatId);
    } catch (error) {
      console.error('FavoriteBeats: Error removing favorite:', error);
      toast.error('Failed to remove from favorites');
    }
  };

  // Show loading state
  if (isLoading || localLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Favorite Beats</h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no favorites or no user
  if (!user) {
    return (
      <EmptyState
        icon={Heart}
        title="Sign in to view favorites"
        description="Please sign in to see your favorite beats."
        actionLabel="Go to Home"
        actionHref="/"
      />
    );
  }

  if (!favoriteBeats || favoriteBeats.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
          <h2 className="text-xl font-bold">Your Favorite Beats (0)</h2>
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
        
        <EmptyState
          icon={Heart}
          title="No favorite beats yet"
          description="When you like beats, they will appear here for easy access."
          actionLabel="Browse Beats"
          actionHref="/"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold">Your Favorite Beats ({favoriteBeats.length})</h2>
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
