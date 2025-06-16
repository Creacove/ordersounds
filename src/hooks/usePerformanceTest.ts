
import { useEffect, useCallback } from 'react';
import { usePerformanceMonitor } from '@/utils/performanceMonitor';

export function usePerformanceTest(componentName: string) {
  const { startTiming, endTiming, logSummary } = usePerformanceMonitor();

  useEffect(() => {
    startTiming(`${componentName}_mount`);
    
    return () => {
      endTiming(`${componentName}_mount`);
    };
  }, [componentName, startTiming, endTiming]);

  const measureRender = useCallback((renderName: string) => {
    const renderKey = `${componentName}_${renderName}`;
    startTiming(renderKey);
    
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      endTiming(renderKey);
    });
  }, [componentName, startTiming, endTiming]);

  const runPerformanceTest = useCallback(() => {
    console.log(`🧪 Running performance test for ${componentName}`);
    
    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`💾 Memory usage:`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
    
    // Network requests
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      console.log(`🌐 Page Load Timing:`, {
        domContentLoaded: `${nav.domContentLoadedEventEnd - nav.navigationStart}ms`,
        loadComplete: `${nav.loadEventEnd - nav.navigationStart}ms`,
        firstPaint: nav.fetchStart - nav.navigationStart
      });
    }
    
    logSummary();
  }, [componentName, logSummary]);

  return {
    measureRender,
    runPerformanceTest
  };
}
