import React from 'react';
import { Card } from '../../../components/common/Card';

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
  successRate: number;
  totalSessions: number;
  activeTasks: number;
  streak: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  successRate = 0,
  totalSessions = 0,
  activeTasks = 0,
  streak = 0
}) => {
  const formattedSuccessRate = typeof successRate === 'number' ? 
    `${(successRate * 100).toFixed(1)}%` : '0.0%';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Success Rate"
        value={formattedSuccessRate}
        description="Overall learning success rate"
        ariaLabel={`Success rate: ${formattedSuccessRate} of all learning activities`}
      />
      <StatCard
        title="Study Sessions"
        value={totalSessions}
        description="Total completed sessions"
        ariaLabel={`Study sessions: ${totalSessions} sessions completed`}
      />
      <StatCard
        title="Active Activities"
        value={activeTasks}
        description="Currently active learning tasks"
        ariaLabel={`Active activities: ${activeTasks} learning tasks in progress`}
      />
      <StatCard
        title="Study Streak"
        value={streak}
        description={`Best streak: ${streak} days`}
        ariaLabel={`Study streak: ${streak} days of continuous learning`}
      />
    </div>
  );
}; 