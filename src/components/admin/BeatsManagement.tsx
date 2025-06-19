
import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp } from 'lucide-react';
import { useAdminOperations } from '@/hooks/admin/useAdminOperations';

export function BeatsManagement() {
  const { stats, isLoading, fetchBeatStats, refreshTrendingBeats } = useAdminOperations();

  useEffect(() => {
    fetchBeatStats();
  }, []);

  const handleRefreshTrending = async () => {
    const success = await refreshTrendingBeats();
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
          Manage trending beats and beat statistics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-sm text-muted-foreground">Target Trending Count</div>
          </div>
        </div>

        {/* Trending Beats Management */}
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Trending Beats Refresh</h3>
              <p className="text-sm text-muted-foreground">
                Randomly select 5 new beats to mark as trending
              </p>
            </div>
            <Badge variant="outline" className="ml-4">
              Auto-refresh System
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
            
            <Button 
              variant="outline" 
              onClick={fetchBeatStats}
              disabled={isLoading}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Operation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Resets all beats' trending status to false</li>
            <li>• Randomly selects 5 published beats</li>
            <li>• Marks selected beats as trending</li>
            <li>• Operation is atomic and logged for audit</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
