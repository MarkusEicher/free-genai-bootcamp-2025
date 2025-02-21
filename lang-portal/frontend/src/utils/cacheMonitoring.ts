import { cacheCompression } from './cacheCompression';

interface CacheMetrics {
  hits: number;
  misses: number;
  errors: number;
  totalRequests: number;
}

interface CacheHealth {
  storageUsage: number;
  itemCount: number;
  compressionRatio: number;
  hitRate: number;
  errorRate: number;
}

class CacheMonitor {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    totalRequests: 0
  };

  private static instance: CacheMonitor;

  private constructor() {}

  static getInstance(): CacheMonitor {
    if (!CacheMonitor.instance) {
      CacheMonitor.instance = new CacheMonitor();
    }
    return CacheMonitor.instance;
  }

  /**
   * Record a cache hit
   */
  recordHit() {
    this.metrics.hits++;
    this.metrics.totalRequests++;
  }

  /**
   * Record a cache miss
   */
  recordMiss() {
    this.metrics.misses++;
    this.metrics.totalRequests++;
  }

  /**
   * Record a cache error
   */
  recordError() {
    this.metrics.errors++;
    this.metrics.totalRequests++;
  }

  /**
   * Get current cache health metrics
   */
  async getHealth(): Promise<CacheHealth> {
    const stats = cacheCompression.getStorageStats();
    const hitRate = this.metrics.totalRequests > 0 
      ? this.metrics.hits / this.metrics.totalRequests 
      : 0;
    const errorRate = this.metrics.totalRequests > 0 
      ? this.metrics.errors / this.metrics.totalRequests 
      : 0;

    return {
      storageUsage: stats.totalSize,
      itemCount: stats.itemCount,
      compressionRatio: stats.compressionRatio,
      hitRate,
      errorRate
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
      totalRequests: 0
    };
  }

  /**
   * Log current cache health to console in development
   */
  async logHealth() {
    if (process.env.NODE_ENV === 'development') {
      const health = await this.getHealth();
      console.group('Cache Health Report');
      console.log('Storage Usage:', (health.storageUsage / 1024).toFixed(2), 'KB');
      console.log('Items:', health.itemCount);
      console.log('Compression Ratio:', health.compressionRatio.toFixed(2));
      console.log('Hit Rate:', (health.hitRate * 100).toFixed(1), '%');
      console.log('Error Rate:', (health.errorRate * 100).toFixed(1), '%');
      console.groupEnd();
    }
  }
}

export const cacheMonitor = CacheMonitor.getInstance(); 