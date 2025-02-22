import React from 'react';
import { Card } from '../../../components/common/Card';
import type { DashboardStats as DashboardStatsType } from '../../../types/dashboard';

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  ariaLabel?: string;
}

interface DashboardStatsProps {
  stats: DashboardStatsType;
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, description, ariaLabel }) => (
  <Card className="p-6">
    <div className="flex flex-col" role="status" aria-label={ariaLabel}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
        {title}
      </dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
        {value}
      </dd>
      <dd className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </dd>
    </div>
  </Card>
);

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, className = '' }) => {
  const successRate = typeof stats.success_rate === 'number' ? 
    `${(stats.success_rate * 100).toFixed(1)}%` : '0.0%';

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <StatCard
        title="Success Rate"
        value={successRate}
        description="Average success rate across all sessions"
        ariaLabel="Success rate statistics"
      />
      <StatCard
        title="Study Sessions"
        value={stats.study_sessions_count}
        description="Total number of completed study sessions"
        ariaLabel="Study sessions count"
      />
      <StatCard
        title="Active Activities"
        value={stats.active_activities_count}
        description="Number of activities in progress"
        ariaLabel="Active activities count"
      />
      <StatCard
        title="Study Streak"
        value={stats.study_streak.current_streak}
        description={`Longest streak: ${stats.study_streak.longest_streak} days`}
        ariaLabel="Current study streak"
      />
    </div>
  );
}; 