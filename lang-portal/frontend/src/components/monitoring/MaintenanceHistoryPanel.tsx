import React from 'react';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';

interface MaintenanceEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  status: 'success' | 'failure';
  action: string;
  details?: string;
}

interface MaintenanceHistoryPanelProps {
  events: MaintenanceEvent[];
  className?: string;
}

const StatusBadge: React.FC<{ status: MaintenanceEvent['status'] }> = ({ status }) => (
  <span
    className={`px-2 py-1 text-xs font-medium rounded-full ${
      status === 'success'
        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300'
        : 'bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300'
    }`}
  >
    {status === 'success' ? 'Success' : 'Failed'}
  </span>
);

const EventRow: React.FC<{ event: MaintenanceEvent }> = ({ event }) => (
  <div className="py-3 border-b last:border-b-0 border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <StatusBadge status={event.status} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {event.ruleName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(event.timestamp, { addSuffix: true })}
          </p>
        </div>
      </div>
      <button
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
        title="View details"
        aria-label={`View details for ${event.ruleName} maintenance event`}
      >
        Details
      </button>
    </div>
    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
      {event.action}
    </p>
    {event.details && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {event.details}
      </p>
    )}
  </div>
);

export const MaintenanceHistoryPanel: React.FC<MaintenanceHistoryPanelProps> = ({
  events,
  className = ''
}) => {
  const recentEvents = events.slice(0, 5); // Show only 5 most recent events

  const successCount = events.filter(e => e.status === 'success').length;
  const failureCount = events.filter(e => e.status === 'failure').length;
  const successRate = events.length > 0 
    ? ((successCount / events.length) * 100).toFixed(1)
    : '0';

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Maintenance History
        </h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="text-gray-500 dark:text-gray-400">Success rate: </span>
            <span className={`font-medium ${
              Number(successRate) > 80 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {successRate}%
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Events</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-gray-100">
            {events.length}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Successful</p>
          <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
            {successCount}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">Failed</p>
          <p className="mt-1 text-2xl font-semibold text-red-600 dark:text-red-400">
            {failureCount}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recent Events
          </h4>
          <button
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            aria-label="View all maintenance events"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentEvents.length > 0 ? (
            recentEvents.map(event => (
              <EventRow key={event.id} event={event} />
            ))
          ) : (
            <p className="py-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              No maintenance events recorded yet
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}; 