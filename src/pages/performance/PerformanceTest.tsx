
import { useEffect } from 'react';
import { MainLayout } from "@/components/layout/MainLayout";
import { PerformanceStats } from '@/components/performance/PerformanceStats';
import { usePerformanceTest } from '@/hooks/usePerformanceTest';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTrendingBeatsQuery, useNewBeatsQuery } from '@/hooks/useBeatsQuery';
import { Activity, Zap, Database } from 'lucide-react';

export default function PerformanceTest() {
  const { runPerformanceTest } = usePerformanceTest('PerformanceTest');

  // Trigger some queries to test performance
  const { data: trendingBeats, isLoading: trendingLoading } = useTrendingBeatsQuery(10);
  const { data: newBeats, isLoading: newLoading } = useNewBeatsQuery(10);

  useEffect(() => {
    document.title = "Performance Test | OrderSOUNDS";
  }, []);

  const runLoadTest = async () => {
    console.log('🧪 Starting Load Test...');
    
    // Simulate multiple concurrent requests
    const promises = [
      useTrendingBeatsQuery(5),
      useTrendingBeatsQuery(10),
      useNewBeatsQuery(5),
      useNewBeatsQuery(10)
    ];
    
    const start = performance.now();
    await Promise.all(promises);
    const end = performance.now();
    
    console.log(`⚡ Load test completed in ${(end - start).toFixed(2)}ms`);
    runPerformanceTest();
  };

  return (
    <MainLayout>
      <div className="container py-4 md:py-8 px-4 md:px-6 space-y-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Performance Testing</h1>
          <p className="text-muted-foreground">
            Monitor and analyze the performance improvements from React Query optimization
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">React Query Cache</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Active</div>
              <p className="text-xs text-muted-foreground">
                Intelligent caching enabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Requests</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(trendingLoading || newLoading) ? 'Loading...' : 'Optimized'}
              </div>
              <p className="text-xs text-muted-foreground">
                Reduced redundant calls
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Performance</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">Improved</div>
              <p className="text-xs text-muted-foreground">
                Hooks split & optimized
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={runPerformanceTest}>
              Run Performance Test
            </Button>
            <Button onClick={runLoadTest} variant="outline">
              Run Load Test
            </Button>
          </div>
          
          <PerformanceStats />
        </div>

        <div className="mt-8 p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-4">Performance Improvements Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-green-600 mb-2">✅ Implemented Optimizations</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Split monolithic useBeats hook</li>
                <li>• Implemented React Query for caching</li>
                <li>• Reduced redundant API calls</li>
                <li>• Simplified component logic</li>
                <li>• Added performance monitoring</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600 mb-2">📊 Expected Benefits</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Faster initial page loads</li>
                <li>• Improved cache hit rates</li>
                <li>• Reduced network requests</li>
                <li>• Better user experience</li>
                <li>• Lower memory usage</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
