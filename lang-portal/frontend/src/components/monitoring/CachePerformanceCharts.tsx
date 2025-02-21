import React from 'react';
import { Card } from '../common/Card';

export const CachePerformanceCharts: React.FC = () => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Cache Performance
      </h3>
      <div className="text-center text-gray-600 dark:text-gray-300">
        Cache performance monitoring has been simplified. 
        Please check the Cache Monitoring Dashboard for basic cache metrics.
      </div>
    </Card>
  );
}; 