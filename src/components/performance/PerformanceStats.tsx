
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { performanceMonitor } from '@/utils/performanceMonitor';
import { BarChart3, RefreshCw, Trash2 } from 'lucide-react';

export function PerformanceStats() {
  const [metrics, setMetrics] = useState(performanceMonitor.getMetrics());

  const refreshMetrics = () => {
    setMetrics(performanceMonitor.getMetrics());
  };

  const clearMetrics = () => {
    performanceMonitor.clearMetrics();
    setMetrics([]);
  };

  const runMemoryTest = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log('🧠 Memory Test Results:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`,
        efficiency: `${((memory.usedJSHeapSize / memory.totalJSHeapSize) * 100).toFixed(1)}%`
      });
    }
  };

  const completedMetrics = metrics.filter(m => m.duration);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Metrics
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearMetrics}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button variant="outline" size="sm" onClick={runMemoryTest}>
            Memory Test
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {completedMetrics.length === 0 ? (
          <p className="text-muted-foreground">No performance data available. Navigate around the app to collect metrics.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedMetrics.map((metric, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{metric.name}</h4>
                    <Badge variant={metric.duration! < 100 ? "success" : metric.duration! < 500 ? "warning" : "destructive"}>
                      {metric.duration!.toFixed(2)}ms
                    </Badge>
                  </div>
                  {metric.metadata && (
                    <pre className="text-xs text-muted-foreground bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(metric.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Operations:</span>
                  <div className="font-medium">{completedMetrics.length}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Average Time:</span>
                  <div className="font-medium">
                    {(completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / completedMetrics.length).toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fastest:</span>
                  <div className="font-medium text-green-600">
                    {Math.min(...completedMetrics.map(m => m.duration || 0)).toFixed(2)}ms
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Slowest:</span>
                  <div className="font-medium text-red-600">
                    {Math.max(...completedMetrics.map(m => m.duration || 0)).toFixed(2)}ms
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
