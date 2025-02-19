import { Card } from '../common';
import { useLatestSessions } from '../../hooks/useApi';
import { format } from 'date-fns';

export function LatestSessions() {
  const { data, isLoading, isError, error } = useLatestSessions();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 text-red-500">
        <p>{error?.message || 'Failed to load recent sessions'}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {data.map((session) => (
          <div
            key={`${session.activity_name}-${session.start_time}`}
            className="border rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">{session.activity_name}</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(session.start_time), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {(session.success_rate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">
                  {session.correct_count}/{session.correct_count + session.incorrect_count}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 