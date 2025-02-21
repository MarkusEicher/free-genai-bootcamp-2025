import React, { useState } from 'react';
import { CacheMonitoringDashboard } from '../../components/monitoring/CacheMonitoringDashboard';
import { Card } from '../../components/common/Card';
import { useCache } from '../../contexts/CacheContext';

export const CacheMonitoringPage: React.FC = () => {
  const { clearCache, invalidateCache } = useCache();
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearing(true);
      await clearCache();
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Cache Monitoring
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage application cache performance
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => invalidateCache()}
            className="px-4 py-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            Invalidate Cache
          </button>
          <button
            onClick={handleClearCache}
            disabled={isClearing}
            className="px-4 py-2 bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClearing ? 'Clearing...' : 'Clear Cache'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <CacheMonitoringDashboard />

        <Card className="p-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Cache Management Tips
          </h2>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <p>
              • Monitor the hit rate to ensure efficient cache utilization. A rate above 80% is ideal.
            </p>
            <p>
              • Keep an eye on storage usage. Clear cache when approaching the 50MB limit.
            </p>
            <p>
              • Check error rates regularly. High error rates may indicate system issues.
            </p>
            <p>
              • The compression ratio shows how effectively data is being compressed. Higher is better.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}; 