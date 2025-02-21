import React from 'react';
import { Card } from '../common/Card';
import { useCache } from '../../contexts/CacheContext';

export const CacheMaintenancePanel: React.FC = () => {
  const { clearCache } = useCache();

  const handleClearCache = () => {
    clearCache();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Cache Maintenance
      </h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Clear Cache
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Remove all cached items and reset cache storage
            </p>
          </div>
          <button
            onClick={handleClearCache}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Clear Cache
          </button>
        </div>
      </div>
    </Card>
  );
}; 