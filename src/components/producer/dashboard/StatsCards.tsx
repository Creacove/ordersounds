
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProducerStats } from "@/lib/producerStats";

interface StatsCardsProps {
  stats: ProducerStats | null;
  isLoadingStats: boolean;
  currency: string;
}

export function StatsCards({ stats, isLoadingStats, currency }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoadingStats ? 
              "Loading..." : 
              formatCurrency(stats?.totalRevenue || 0, currency)
            }
          </div>
          {!isLoadingStats && stats && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`${stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.revenueChange >= 0 ? '↑' : '↓'} {Math.abs(stats.revenueChange)}%
              </span> from last month
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Plays
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoadingStats ? "Loading..." : (stats?.totalPlays || 0).toLocaleString()}
          </div>
          {!isLoadingStats && stats && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`${stats.playsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.playsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.playsChange)}%
              </span> from last month
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Beats Sold
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoadingStats ? "Loading..." : (stats?.beatsSold || 0).toLocaleString()}
          </div>
          {!isLoadingStats && stats && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`${stats.salesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.salesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.salesChange)}%
              </span> from last month
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            New Favorites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoadingStats ? "Loading..." : (stats?.totalFavorites || 0).toLocaleString()}
          </div>
          {!isLoadingStats && stats && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className={`${stats.favoritesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.favoritesChange >= 0 ? '↑' : '↓'} {Math.abs(stats.favoritesChange)}%
              </span> from last month
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
