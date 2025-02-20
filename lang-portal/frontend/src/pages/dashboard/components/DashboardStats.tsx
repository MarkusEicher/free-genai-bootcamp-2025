import React, { useRef, useState } from 'react';
import type { DashboardStats } from '../../../types/dashboard';

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
}

const StatCard: React.FC<StatCardProps> = ({ label, value, description, trend }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  const handleFocus = () => setIsHovered(true);
  const handleBlur = () => setIsHovered(false);

  return (
    <div
      ref={cardRef}
      className={`p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm 
        transition-all duration-300 ease-in-out
        ${isHovered ? 'transform scale-[1.02] shadow-md' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      tabIndex={0}
      role="article"
      aria-labelledby={`stat-label-${label.toLowerCase().replace(/\s+/g, '-')}`}
      aria-describedby={description ? `stat-desc-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined}
    >
      <h3 
        id={`stat-label-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className={`text-sm font-medium text-gray-500 dark:text-gray-400 
          transition-all duration-300 ${isHovered ? 'text-gray-700 dark:text-gray-300' : ''}`}
      >
        {label}
      </h3>

      <div className={`mt-2 flex items-baseline transition-all duration-300 ${isHovered ? 'transform translate-x-1' : ''}`}>
        <p 
          className="text-2xl font-semibold text-gray-900 dark:text-gray-100"
          aria-label={`${label}: ${value}`}
        >
          {value}
        </p>
        {trend && (
          <p 
            className={`ml-2 flex items-baseline text-sm font-semibold ${
              trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
            aria-live="polite"
          >
            <span className={`transform transition-transform duration-300 ${isHovered ? 'translate-y-[-2px]' : ''}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="sr-only">
              {trend.value >= 0 ? 'Increased' : 'Decreased'} by {Math.abs(trend.value)}%
            </span>
          </p>
        )}
      </div>
      {description && (
        <p 
          id={`stat-desc-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className={`mt-1 text-sm text-gray-500 dark:text-gray-400 
            transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-80'}`}
          aria-label={description}
        >
          {description}
        </p>
      )}
      
      {isHovered && (
        <div 
          className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700
            transform transition-all duration-300 ease-in-out"
          role="region"
          aria-label={`Additional details for ${label}`}
        >
          <button
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400
              focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            aria-label={`View detailed statistics for ${label}`}
          >
            View Details →
          </button>
        </div>
      )}
    </div>
  );
};

interface DashboardStatsProps {
  stats: DashboardStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  // Ensure numeric values and proper formatting
  const successRate = typeof stats.success_rate === 'number' ? 
    `${(stats.success_rate * 100).toFixed(1)}%` : '0%';
  
  const studySessionsCount = typeof stats.study_sessions_count === 'number' ? 
    stats.study_sessions_count.toString() : '0';
  
  const activeActivitiesCount = typeof stats.active_activities_count === 'number' ? 
    stats.active_activities_count.toString() : '0';
  
  const currentStreak = typeof stats.study_streak?.current_streak === 'number' ? 
    stats.study_streak.current_streak.toString() : '0';
  
  const longestStreak = typeof stats.study_streak?.longest_streak === 'number' ? 
    stats.study_streak.longest_streak : 0;

  const statCards = [
    {
      label: 'Success Rate',
      value: successRate,
      description: 'Overall learning success rate'
    },
    {
      label: 'Study Sessions',
      value: studySessionsCount,
      description: 'Total completed sessions'
    },
    {
      label: 'Active Activities',
      value: activeActivitiesCount,
      description: 'Currently active learning tasks'
    },
    {
      label: 'Study Streak',
      value: currentStreak,
      description: `Best streak: ${longestStreak} days`
    }
  ];

  return (
    <div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" 
      role="region" 
      aria-label="Dashboard Statistics"
      data-section="stats"
    >
      {statCards.map((stat) => (
        <StatCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          description={stat.description}
        />
      ))}
    </div>
  );
}; 