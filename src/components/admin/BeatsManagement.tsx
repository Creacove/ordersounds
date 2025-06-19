
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, Star, Calendar } from 'lucide-react';
import { useAdminOperations } from '@/hooks/admin/useAdminOperations';

export function BeatsManagement() {
  const { 
    stats, 
    isLoading, 
    fetchBeatStats, 
    refreshTrendingBeats, 
    refreshFeaturedBeats, 
    refreshWeeklyPicks 
  } = useAdminOperations();

  useEffect(() => {
    fetchBeatStats();
  }, []);

  const handleRefreshTrending = async () => {
    const success = await refreshTrendingBeats();
    if (success) {
      // Stats will be automatically refreshed in the hook
    }
  };

  const handleRefreshFeatured = async () => {
    const success = await refreshFeaturedBeats();
    if (success) {
      // Stats will be automatically refreshed in the hook
    }
  };

  const handleRefreshWeeklyPicks = async () => {
    const success = await refreshWeeklyPicks();
    if (success) {
      // Stats will be automatically refreshed in the hook
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Beats Management
        </CardTitle>
        <CardDescription>
          Manage trending beats, featured beats, weekly picks, and beat statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.totalBeats || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total Published Beats</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.trendingCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Currently Trending</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.featuredCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Currently Featured</div>
          </div>
          
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.weeklyPicksCount || 0}
            </div>
            <div className="text-sm text-muted-foreground">Weekly Picks</div>
          </div>
        </div>

        {/* Trending Beats Management */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Trending Beats Refresh
              </h3>
              <p className="text-sm text-muted-foreground">
                Randomly select 5 new beats to mark as trending
              </p>
            </div>
            <Badge variant="outline" className="ml-4">
              Target: 5 beats
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRefreshTrending}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Trending Beats
            </Button>
          </div>
        </div>

        {/* Featured Beats Management */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Star className="h-5 w-5" />
                Featured Beats Refresh
              </h3>
              <p className="text-sm text-muted-foreground">
                Select 1 new beat to mark as featured (premium spotlight)
              </p>
            </div>
            <Badge variant="outline" className="ml-4">
              Target: 1 beat
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRefreshFeatured}
              disabled={isLoading}
              className="flex items-center gap-2"
              variant="secondary"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Featured Beat
            </Button>
          </div>
        </div>

        {/* Weekly Picks Management */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Picks Refresh
              </h3>
              <p className="text-sm text-muted-foreground">
                Randomly select 6 new beats to mark as weekly picks
              </p>
            </div>
            <Badge variant="outline" className="ml-4">
              Target: 5-7 beats
            </Badge>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleRefreshWeeklyPicks}
              disabled={isLoading}
              className="flex items-center gap-2"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Weekly Picks
            </Button>
          </div>
        </div>

        {/* Global Refresh */}
        <div className="flex justify-center pt-4">
          <Button 
            variant="outline" 
            onClick={fetchBeatStats}
            disabled={isLoading}
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All Stats
          </Button>
        </div>

        {/* Operation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Beat Management Operations:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Trending:</strong> Resets all trending status, selects 5 random beats</li>
            <li>• <strong>Featured:</strong> Resets featured status, selects 1 premium spotlight beat</li>
            <li>• <strong>Weekly Picks:</strong> Resets weekly picks, selects 6 curated beats</li>
            <li>• All operations are atomic and logged for audit purposes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
