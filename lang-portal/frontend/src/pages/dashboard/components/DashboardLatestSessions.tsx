import React, { useRef } from 'react';
import { Card } from '../../../components/common';
import type { LatestSession } from '../../../types/dashboard';

interface SessionItemProps {
  session: LatestSession;
  index: number;
}

const SessionItem: React.FC<SessionItemProps> = ({ session, index }) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const successRate = typeof session.success_rate === 'number' ? 
    Math.round(session.success_rate * 100) : 0;
  const totalAnswers = (typeof session.correct_count === 'number' ? session.correct_count : 0) + 
    (typeof session.incorrect_count === 'number' ? session.incorrect_count : 0);
  const startTime = new Date(session.start_time);
  const endTime = session.end_time ? new Date(session.end_time) : null;
  
  const duration = endTime 
    ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) 
    : null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      itemRef.current?.focus();
    }
  };

  const getSuccessRateDescription = (rate: number) => {
    if (rate >= 80) return 'Excellent performance';
    if (rate >= 60) return 'Good performance';
    return 'Needs improvement';
  };

  const activityName = typeof session.activity_name === 'string' ? session.activity_name : 'Unknown Activity';
  const activityType = typeof session.activity_type === 'string' ? session.activity_type : 'unknown';
  const practiceDirection = typeof session.practice_direction === 'string' ? session.practice_direction : 'unknown';
  const groupCount = typeof session.group_count === 'number' ? session.group_count : 0;
  const correctCount = typeof session.correct_count === 'number' ? session.correct_count : 0;

  return (
    <div 
      ref={itemRef}
      className="p-4 border-b last:border-b-0 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
      role="article"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-labelledby={`session-title-${index}`}
      aria-describedby={`session-details-${index} session-stats-${index}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 
            id={`session-title-${index}`}
            className="text-sm font-medium text-gray-900 dark:text-gray-100"
          >
            {activityName}
          </h4>
          <p 
            id={`session-details-${index}`}
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
          >
            {activityType} • {practiceDirection} • {groupCount} groups
          </p>
        </div>
        <div className="text-right">
          <p 
            className={`text-sm font-medium ${
              successRate >= 80 ? 'text-green-600 dark:text-green-400' : 
              successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 
              'text-red-600 dark:text-red-400'
            }`}
            id={`session-stats-${index}`}
            aria-label={`${getSuccessRateDescription(successRate)} with ${successRate}% success rate`}
          >
            {successRate}% Success
          </p>
          <p 
            className="mt-1 text-xs text-gray-500 dark:text-gray-400"
            aria-label={`${correctCount} correct answers out of ${totalAnswers} total answers`}
          >
            {correctCount} / {totalAnswers} correct
          </p>
        </div>
      </div>
      
      <div 
        className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400"
        aria-label={`Session time: ${startTime.toLocaleDateString()} ${startTime.toLocaleTimeString()}${
          duration ? `, Duration: ${duration} minutes` : ''
        }`}
      >
        <time dateTime={session.start_time}>
          {startTime.toLocaleDateString()} {startTime.toLocaleTimeString()}
        </time>
        {duration && (
          <span className="ml-2">
            • {duration} min
          </span>
        )}
      </div>

      {/* Progress Bar */}
      <div 
        className="mt-2 h-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={successRate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Session success rate: ${successRate}%`}
      >
        <div
          className={`h-full transition-all duration-300 ${
            successRate >= 80 ? 'bg-green-600 dark:bg-green-500' :
            successRate >= 60 ? 'bg-yellow-600 dark:bg-yellow-500' :
            'bg-red-600 dark:bg-red-500'
          }`}
          style={{ width: `${successRate}%` }}
        />
      </div>
    </div>
  );
};

interface DashboardLatestSessionsProps {
  sessions?: LatestSession[];
}

export const DashboardLatestSessions: React.FC<DashboardLatestSessionsProps> = ({ sessions = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  if (!sessions) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          Loading sessions...
        </div>
      </Card>
    );
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          No recent sessions found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <div
            key={`${session.activity_name}-${session.start_time}-${index}`}
            className="border-b last:border-b-0 pb-4 last:pb-0"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100">
                  {session.activity_name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(session.start_time).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {(session.success_rate * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.correct_count} / {session.correct_count + session.incorrect_count}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}; 