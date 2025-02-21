import React from 'react';
import { Card } from '../../../components/common/Card';
import { CacheStatus } from '../../../components/common/CacheStatus';
import { useCacheableQuery } from '../../../hooks/useCacheableQuery';
import { dashboardApi } from '../../../api/dashboard';
import type { DashboardStats as DashboardStatsType } from '../../../types/dashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  ariaLabel?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  description,
  ariaLabel 
}) => (
  <Card 
    className="p-6 flex flex-col justify-between h-full"
    role="region"
    aria-label={ariaLabel || `${title}: ${value}`}
  >
    <div>
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {title}
      </h3>
      <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-50">
        {value}
      </p>
    </div>
    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
      {description}
    </p>
  </Card>
);

interface DashboardStatsProps {
  className?: string;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ className = '' }) => {
  const { 
    data: stats,
    isLoading,
    error,
    isCacheHit,
    cacheStatus,
    refetch
  } = useCacheableQuery<DashboardStatsType>({
    cacheKey: 'dashboard-stats',
    queryFn: dashboardApi.getDashboardStats,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  });

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/10">
        <div className="text-red-800 dark:text-red-200">
          Failed to load dashboard statistics
        </div>
        <button
          onClick={() => refetch()}
          className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
        >
          Retry
        </button>
      </Card>
    );
  }

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="mt-4 h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
            <div className="mt-2 h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const successRate = typeof stats.success_rate === 'number' ? 
    `${(stats.success_rate * 100).toFixed(1)}%` : '0.0%';

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-50">
          Dashboard Statistics
        </h2>
        <div className="flex items-center space-x-4">
          <CacheStatus
            isCacheHit={isCacheHit}
            timestamp={cacheStatus?.timestamp}
            expires={cacheStatus?.expires}
          />
          <button
            onClick={() => refetch()}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            aria-label="Refresh statistics"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Success Rate"
          value={successRate}
          description="Overall learning success rate"
          ariaLabel={`Success rate: ${successRate} of all learning activities`}
        />
        <StatCard
          title="Study Sessions"
          value={stats.study_sessions_count}
          description="Total completed sessions"
          ariaLabel={`Study sessions: ${stats.study_sessions_count} sessions completed`}
        />
        <StatCard
          title="Active Activities"
          value={stats.active_activities_count}
          description="Currently active learning tasks"
          ariaLabel={`Active activities: ${stats.active_activities_count} learning tasks in progress`}
        />
        <StatCard
          title="Study Streak"
          value={stats.study_streak.current_streak}
          description={`Best streak: ${stats.study_streak.longest_streak} days`}
          ariaLabel={`Study streak: ${stats.study_streak.current_streak} days of continuous learning`}
        />
      </div>
    </div>
  );
}; 