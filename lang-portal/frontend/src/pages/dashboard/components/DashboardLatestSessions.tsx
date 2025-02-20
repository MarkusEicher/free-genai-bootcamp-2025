import React, { useRef } from 'react';
import { Card } from '../../../components/common/Card';
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
      className="p-4 border-b last:border-b-0 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
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
            className="text-base font-semibold text-gray-900 dark:text-white"
          >
            {activityName}
          </h4>
          <p 
            id={`session-details-${index}`}
            className="mt-1 text-sm text-gray-800 dark:text-gray-200"
          >
            {activityType} • {practiceDirection} • {groupCount} groups
          </p>
        </div>
        <div className="text-right">
          <p 
            className={`text-base font-semibold ${
              successRate >= 80 ? 'text-green-900 dark:text-green-200' : 
              successRate >= 60 ? 'text-amber-900 dark:text-amber-200' : 
              'text-red-900 dark:text-red-200'
            }`}
            id={`session-stats-${index}`}
            aria-label={`${getSuccessRateDescription(successRate)} with ${successRate}% success rate`}
          >
            {successRate}% Success
          </p>
          <p 
            className="mt-1 text-sm text-gray-800 dark:text-gray-200"
            aria-label={`${correctCount} correct answers out of ${totalAnswers} total answers`}
          >
            {correctCount} / {totalAnswers} correct
          </p>
        </div>
      </div>
      
      <div 
        className="mt-2 flex items-center text-sm text-gray-800 dark:text-gray-200"
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
        className="mt-3 h-2 w-full bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={successRate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Session success rate: ${successRate}%`}
      >
        <div
          className={`h-full transition-all duration-300 ${
            successRate >= 80 ? 'bg-green-800 dark:bg-green-600' :
            successRate >= 60 ? 'bg-amber-800 dark:bg-amber-600' :
            'bg-red-800 dark:bg-red-600'
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
        <div className="text-center text-gray-700 dark:text-gray-300">
          Loading sessions...
        </div>
      </Card>
    );
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-700 dark:text-gray-300">
          No recent sessions found
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">
        Latest Sessions
      </h3>
      <div className="space-y-4">
        {sessions.map((session, index) => (
          <SessionItem 
            key={`${session.activity_name}-${session.start_time}-${index}`}
            session={session}
            index={index}
          />
        ))}
      </div>
    </Card>
  );
}; 