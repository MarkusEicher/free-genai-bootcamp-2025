import React from 'react';
import { CacheMonitoringDashboard } from '../../components/monitoring/CacheMonitoringDashboard';
import { CacheManagementPanel } from '../../components/monitoring/CacheManagementPanel';
import { CacheMaintenancePanel } from '../../components/monitoring/CacheMaintenancePanel';
import { CachePerformanceCharts } from '../../components/monitoring/CachePerformanceCharts';
import { MaintenanceHistoryPanel } from '../../components/monitoring/MaintenanceHistoryPanel';

export const CacheMonitoringPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Cache Monitoring
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Real-time cache performance monitoring and management
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          <CacheMonitoringDashboard />
          <CachePerformanceCharts />
          <MaintenanceHistoryPanel events={[]} />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          <CacheManagementPanel />
          <CacheMaintenancePanel />
        </div>
      </div>
    </div>
  );
}; 