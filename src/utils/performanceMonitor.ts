
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private isEnabled: boolean = process.env.NODE_ENV === 'development';

  startTiming(name: string, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;
    
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
    
    console.log(`🚀 Performance: Started timing "${name}"`, metadata || '');
  }

  endTiming(name: string) {
    if (!this.isEnabled) return;
    
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`⚠️ Performance: No start time found for "${name}"`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;
    
    console.log(`✅ Performance: "${name}" completed in ${duration.toFixed(2)}ms`, metric.metadata || '');
    
    return duration;
  }

  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    if (!this.isEnabled) return fn();
    
    this.startTiming(name, metadata);
    
    return fn().then(
      (result) => {
        this.endTiming(name);
        return result;
      },
      (error) => {
        this.endTiming(name);
        throw error;
      }
    );
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    if (!this.isEnabled) return fn();
    
    this.startTiming(name, metadata);
    const result = fn();
    this.endTiming(name);
    
    return result;
  }

  getMetrics() {
    return Array.from(this.metrics.values());
  }

  clearMetrics() {
    this.metrics.clear();
  }

  logSummary() {
    if (!this.isEnabled) return;
    
    const metrics = this.getMetrics().filter(m => m.duration);
    
    console.group('📊 Performance Summary');
    metrics.forEach(metric => {
      console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`);
    });
    console.groupEnd();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Hook for React components
export function usePerformanceMonitor() {
  return {
    startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
    endTiming: performanceMonitor.endTiming.bind(performanceMonitor),
    measureAsync: performanceMonitor.measureAsync.bind(performanceMonitor),
    measureSync: performanceMonitor.measureSync.bind(performanceMonitor),
    getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor),
    logSummary: performanceMonitor.logSummary.bind(performanceMonitor)
  };
}
