import { Card } from '../common';
import { useDashboardStats } from '../../hooks/useApi';
import { colors } from '../../utils/colors';

interface StatItemProps {
  label: string;
  value: string | number;
  description?: string;
}

const StatItem = ({ label, value, description }: StatItemProps) => (
  <div className="space-y-1">
    <dt className={`${colors.text.secondary} text-sm`}>{label}</dt>
    <dd className={`${colors.text.primary} text-2xl font-semibold`}>
      {value}
    </dd>
    {description && (
      <p className={`${colors.text.secondary} text-sm`} aria-description={label}>
        {description}
      </p>
    )}
  </div>
);

export function DashboardStats() {
  const { data, isLoading, isError, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-6">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </dl>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div role="alert" className={`${colors.text.error}`}>
          <p>{error?.message || 'Failed to load dashboard statistics'}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6">
      <dl 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        role="region"
        aria-label="Dashboard Statistics Overview"
      >
        <StatItem
          label="Success Rate"
          value={`${(data.success_rate * 100).toFixed(1)}%`}
          description="Overall learning success"
        />
        
        <StatItem
          label="Study Sessions"
          value={data.study_sessions_count}
          description="Total completed sessions"
        />

        <StatItem
          label="Active Activities"
          value={data.active_activities_count}
          description="Currently active learning tasks"
        />

        <StatItem
          label="Study Streak"
          value={data.study_streak.current_streak}
          description={`Best streak: ${data.study_streak.longest_streak} days`}
        />
      </dl>
    </Card>
  );
} 