import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { useCache } from '../../contexts/CacheContext';
import { cacheMonitor } from '../../utils/cacheMonitoring';
import { cacheCompression } from '../../utils/cacheCompression';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  trend,
  className = ''
}) => (
  <Card className={`p-4 ${className}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {title}
    </h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {value}
      </p>
      {trend && (
        <span className={`ml-2 text-sm ${
          trend === 'up' ? 'text-green-600 dark:text-green-400' :
          trend === 'down' ? 'text-red-600 dark:text-red-400' :
          'text-gray-500 dark:text-gray-400'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
    {description && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
  </Card>
);

interface CacheMetrics {
  hitRate: number;
  errorRate: number;
  storageUsage: number;
  itemCount: number;
  compressionRatio: number;
}

export const CacheMonitoringDashboard: React.FC = () => {
  const { getStorageStats } = useCache();
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateMetrics = async () => {
      try {
        const health = await cacheMonitor.getHealth();
        setMetrics({
          hitRate: health.hitRate,
          errorRate: health.errorRate,
          storageUsage: health.storageUsage,
          itemCount: health.itemCount,
          compressionRatio: health.compressionRatio
        });
      } catch (error) {
        console.error('Failed to fetch cache metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            <div className="mt-2 h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/10">
        <p className="text-red-800 dark:text-red-200">
          Failed to load cache metrics
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${(metrics.hitRate * 100).toFixed(1)}%`}
          description="Percentage of successful cache retrievals"
          trend={metrics.hitRate > 0.8 ? 'up' : metrics.hitRate < 0.5 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Error Rate"
          value={`${(metrics.errorRate * 100).toFixed(1)}%`}
          description="Percentage of failed cache operations"
          trend={metrics.errorRate > 0.1 ? 'down' : 'up'}
        />
        <MetricCard
          title="Storage Usage"
          value={`${(metrics.storageUsage / 1024 / 1024).toFixed(2)} MB`}
          description="Total cache storage consumption"
          trend={metrics.storageUsage > 40 * 1024 * 1024 ? 'down' : 'neutral'}
        />
        <MetricCard
          title="Compression Ratio"
          value={metrics.compressionRatio.toFixed(2)}
          description="Data compression efficiency"
          trend={metrics.compressionRatio > 2 ? 'up' : 'neutral'}
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Cache Status Overview
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Total Items</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {metrics.itemCount}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Storage Limit</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              50 MB
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Storage Used</span>
            <div className="flex items-center">
              <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    metrics.storageUsage > 40 * 1024 * 1024
                      ? 'bg-red-600'
                      : metrics.storageUsage > 30 * 1024 * 1024
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${(metrics.storageUsage / (50 * 1024 * 1024)) * 100}%`
                  }}
                />
              </div>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {((metrics.storageUsage / (50 * 1024 * 1024)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 