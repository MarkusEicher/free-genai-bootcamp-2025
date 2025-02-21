import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useCache } from '../../contexts/CacheContext';
import { cacheMonitor } from '../../utils/cacheMonitoring';

interface MetricDataPoint {
  timestamp: number;
  hitRate: number;
  errorRate: number;
  storageUsage: number;
  compressionRatio: number;
}

const MAX_DATA_POINTS = 60; // 5 minutes of data with 5-second intervals

export const CachePerformanceCharts: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<MetricDataPoint[]>([]);
  const { getStorageStats } = useCache();

  useEffect(() => {
    const updateMetrics = async () => {
      const metrics = cacheMonitor.getMetrics();
      const stats = await getStorageStats();
      
      const newDataPoint: MetricDataPoint = {
        timestamp: Date.now(),
        hitRate: metrics.hitRate * 100,
        errorRate: metrics.errorRate * 100,
        storageUsage: (stats.usage / stats.quota) * 100,
        compressionRatio: stats.compressionRatio * 100
      };

      setPerformanceData(prevData => {
        const newData = [...prevData, newDataPoint];
        return newData.slice(-MAX_DATA_POINTS);
      });
    };

    // Initial update
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [getStorageStats]);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
        Cache Performance Metrics
      </h3>

      <div className="space-y-8">
        {/* Hit Rate and Error Rate Chart */}
        <div className="h-80">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Hit Rate vs Error Rate
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelFormatter={formatTime}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="hitRate"
                name="Hit Rate"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="errorRate"
                name="Error Rate"
                stroke="#EF4444"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Storage Usage Chart */}
        <div className="h-80">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Storage Utilization
          </h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                interval="preserveStartEnd"
              />
              <YAxis domain={[0, 100]} />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(1)}%`}
                labelFormatter={formatTime}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="storageUsage"
                name="Storage Usage"
                fill="#6366F1"
                fillOpacity={0.2}
                stroke="#6366F1"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="compressionRatio"
                name="Compression Ratio"
                fill="#F59E0B"
                fillOpacity={0.2}
                stroke="#F59E0B"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}; 