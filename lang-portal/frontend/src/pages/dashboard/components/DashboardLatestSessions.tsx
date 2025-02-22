import React from 'react';
import { Card } from '../../../components/common/Card';
import type { LatestSession } from '../../../types/dashboard';

interface SessionItemProps {
  session: LatestSession;
  index: number;
}

interface DashboardLatestSessionsProps {
  sessions: LatestSession[];
  className?: string;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, index }) => {
  const formattedDate = new Date(session.completed_at).toLocaleDateString();
  const formattedTime = new Date(session.completed_at).toLocaleTimeString();
  
  return (
    <div 
      className="flex items-center p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700"
      role="listitem"
    >
      <div className="flex-1">
        <div className="flex items-center">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {session.activity_name}
          </span>
          <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            {session.language_pair}
          </span>
        </div>
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formattedDate} at {formattedTime}
        </div>
      </div>
      <div className="ml-4 text-right">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {session.score}%
        </div>
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {session.items_completed} items
        </div>
      </div>
    </div>
  );
};

export const DashboardLatestSessions: React.FC<DashboardLatestSessionsProps> = ({ sessions, className = '' }) => {
  return (
    <Card className={`${className}`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Latest Sessions
        </h2>
      </div>
      
      {sessions.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
          No sessions completed yet
        </div>
      ) : (
        <div role="list" aria-label="Latest learning sessions">
          {sessions.map((session, index) => (
            <SessionItem
              key={session.id}
              session={session}
              index={index}
            />
          ))}
        </div>
      )}
    </Card>
  );
}; 