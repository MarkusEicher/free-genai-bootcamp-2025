import { Card } from '../common';
import { useDashboardStats } from '../../hooks/useApi';

export function DashboardStats() {
  const { data, isLoading, isError, error } = useDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-lg"></div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 text-red-500">
        <p>{error?.message || 'Failed to load dashboard statistics'}</p>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <h3 className="text-sm text-gray-500">Success Rate</h3>
          <p className="text-2xl font-semibold">
            {(data.success_rate * 100).toFixed(1)}%
          </p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm text-gray-500">Study Sessions</h3>
          <p className="text-2xl font-semibold">{data.study_sessions_count}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-gray-500">Active Activities</h3>
          <p className="text-2xl font-semibold">{data.active_activities_count}</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm text-gray-500">Study Streak</h3>
          <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-semibold">{data.study_streak.current_streak}</p>
            <p className="text-sm text-gray-500">
              Best: {data.study_streak.longest_streak}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
} 