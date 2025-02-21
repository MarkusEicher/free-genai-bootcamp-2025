import React, { useRef } from 'react';
import { Card } from '../../../components/common/Card';
import { CacheStatus } from '../../../components/common/CacheStatus';
import { useCacheableQuery } from '../../../hooks/useCacheableQuery';
import { dashboardApi } from '../../../api/dashboard';
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
  className?: string;
}

export const DashboardLatestSessions: React.FC<DashboardLatestSessionsProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    data: sessions,
    isLoading,
    error,
    isCacheHit,
    cacheStatus,
    refetch
  } = useCacheableQuery<LatestSession[]>({
    cacheKey: 'dashboard-latest-sessions',
    queryFn: () => dashboardApi.getLatestSessions(5),
    cacheDuration: 2 * 60 * 1000 // 2 minutes - shorter duration since this data changes frequently
  });

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/10">
        <div className="text-red-800 dark:text-red-200">
          Failed to load latest sessions
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

  if (isLoading || !sessions) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return (
      <Card className="p-6">
        <div 
          className="text-center text-gray-700 dark:text-gray-300"
          role="status"
          aria-live="polite"
        >
          No recent sessions found
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 
          className="text-lg font-semibold text-gray-900 dark:text-gray-50"
          id="latest-sessions-title"
        >
          Latest Sessions
        </h3>
        <div className="flex items-center space-x-4">
          <CacheStatus
            isCacheHit={isCacheHit}
            timestamp={cacheStatus?.timestamp}
            expires={cacheStatus?.expires}
          />
          <button
            onClick={() => refetch()}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            aria-label="Refresh latest sessions"
          >
            Refresh
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="space-y-4"
        role="feed"
        aria-labelledby="latest-sessions-title"
      >
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