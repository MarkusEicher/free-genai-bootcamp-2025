import React, { useEffect, useState } from 'react';
import { Card } from '../common/Card';
import { useCache } from '../../contexts/CacheContext';

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  className = ''
}) => (
  <Card className={`p-4 ${className}`}>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
      {title}
    </h3>
    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">
      {value}
    </p>
    {description && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
    )}
  </Card>
);

export const CacheMonitoringDashboard: React.FC = () => {
  const { getCacheStatus } = useCache();
  const [cacheSize, setCacheSize] = useState<number>(0);
  const [itemCount, setItemCount] = useState<number>(0);

  useEffect(() => {
    const calculateCacheStats = () => {
      let size = 0;
      let count = 0;
      
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('lang_portal_cache_')) {
          const item = localStorage.getItem(key);
          if (item) {
            size += new Blob([item]).size;
            count++;
          }
        }
      });

      setCacheSize(size);
      setItemCount(count);
    };

    calculateCacheStats();
    // Update stats every 30 seconds
    const interval = setInterval(calculateCacheStats, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Cache Size"
          value={`${(cacheSize / 1024 / 1024).toFixed(2)} MB`}
          description="Total storage used by cache"
        />
        <MetricCard
          title="Cached Items"
          value={itemCount}
          description="Number of items in cache"
        />
        <MetricCard
          title="Storage Limit"
          value="10 MB"
          description="Maximum cache storage limit"
        />
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Cache Status Overview
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-300">Storage Used</span>
            <div className="flex items-center">
              <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    cacheSize > 8 * 1024 * 1024
                      ? 'bg-red-600'
                      : cacheSize > 6 * 1024 * 1024
                      ? 'bg-yellow-600'
                      : 'bg-green-600'
                  }`}
                  style={{
                    width: `${(cacheSize / (10 * 1024 * 1024)) * 100}%`
                  }}
                />
              </div>
              <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                {((cacheSize / (10 * 1024 * 1024)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}; 