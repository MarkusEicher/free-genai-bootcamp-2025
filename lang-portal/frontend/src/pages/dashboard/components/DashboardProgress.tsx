import React, { useRef, useEffect } from 'react';
import { Card } from '../../../components/common/Card';
import { CacheStatus } from '../../../components/common/CacheStatus';
import { useCacheableQuery } from '../../../hooks/useCacheableQuery';
import { dashboardApi } from '../../../api/dashboard';
import type { DashboardProgress as DashboardProgressType } from '../../../types/dashboard';

interface ProgressBarProps {
  percentage: number;
  label: string;
  color?: string;
  showLabel?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  percentage, 
  label, 
  color = 'var(--color-primary-600)',
  showLabel = true
}) => {
  const width = Math.max(0, Math.min(100, percentage));
  const progressRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Announce progress changes to screen readers
    const progressBar = progressRef.current;
    if (progressBar) {
      progressBar.setAttribute('aria-valuenow', width.toString());
    }
  }, [width]);

  return (
    <div className="relative pt-1">
      {showLabel && (
        <div className="flex items-center justify-between">
          <div>
            <span 
              className="text-sm font-medium text-gray-900 dark:text-gray-400"
              id={`progress-label-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {label}
            </span>
          </div>
          <div 
            className="text-sm text-gray-700 dark:text-gray-400"
            aria-live="polite"
            aria-atomic="true"
          >
            {width.toFixed(1)}%
          </div>
        </div>
      )}
      <div className="mt-2">
        <div 
          ref={progressRef}
          role="progressbar" 
          aria-valuenow={width} 
          aria-valuemin={0} 
          aria-valuemax={100}
          aria-label={`${label}: ${width.toFixed(1)}%`}
          aria-labelledby={showLabel ? `progress-label-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined}
          className="relative h-4 w-full bg-gray-200 dark:bg-gray-700 rounded"
          tabIndex={0}
        >
          <div
            style={{ width: `${width}%`, backgroundColor: color }}
            className="absolute h-full rounded transition-all duration-300 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
};

interface DashboardProgressProps {
  className?: string;
}

export const DashboardProgress: React.FC<DashboardProgressProps> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    data: progress,
    isLoading,
    error,
    isCacheHit,
    cacheStatus,
    refetch
  } = useCacheableQuery<DashboardProgressType>({
    cacheKey: 'dashboard-progress',
    queryFn: dashboardApi.getDashboardProgress,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  });

  useEffect(() => {
    // Ensure proper focus management
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const progressBar = container.querySelector('[role="progressbar"]');
        if (progressBar instanceof HTMLElement) {
          progressBar.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (error) {
    return (
      <Card className="p-6 bg-red-50 dark:bg-red-900/10">
        <div className="text-red-800 dark:text-red-200">
          Failed to load progress data
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

  if (isLoading || !progress) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>
      </Card>
    );
  }

  // Ensure numeric values
  const progressPercentage = typeof progress.progress_percentage === 'number' ? progress.progress_percentage : 0;
  const totalItems = typeof progress.total_items === 'number' ? progress.total_items : 0;
  const masteredItems = typeof progress.mastered_items === 'number' ? progress.mastered_items : 0;
  const studiedItems = typeof progress.studied_items === 'number' ? progress.studied_items : 0;
  const inProgressItems = studiedItems - masteredItems;

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 
            className="text-lg font-medium text-gray-900 dark:text-gray-50"
            id="progress-section-title"
          >
            Learning Progress
          </h2>
          <p 
            className="text-sm text-gray-500 dark:text-gray-400"
            id="progress-section-description"
          >
            Track your learning journey
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <CacheStatus
            isCacheHit={isCacheHit}
            timestamp={cacheStatus?.timestamp}
            expires={cacheStatus?.expires}
          />
          <button
            onClick={() => refetch()}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            aria-label="Refresh progress"
          >
            Refresh
          </button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="space-y-6"
        role="region"
        aria-labelledby="progress-section-title"
        aria-describedby="progress-section-description"
        tabIndex={0}
      >
        <ProgressBar
          percentage={progressPercentage}
          label="Total Progress"
          color="var(--color-primary-600)"
        />

        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          role="list"
          aria-label="Progress Details"
        >
          <div 
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
            role="listitem"
          >
            <h3 
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
              id="mastered-items-label"
            >
              Items Mastered
            </h3>
            <p 
              className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100"
              aria-labelledby="mastered-items-label"
            >
              {masteredItems}
              <span className="text-sm font-normal text-gray-700 dark:text-gray-200 ml-2">
                / {totalItems}
              </span>
            </p>
          </div>

          <div 
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
            role="listitem"
          >
            <h3 
              className="text-sm font-medium text-gray-700 dark:text-gray-200"
              id="in-progress-items-label"
            >
              Items in Progress
            </h3>
            <p 
              className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100"
              aria-labelledby="in-progress-items-label"
            >
              {inProgressItems}
              <span className="text-sm font-normal text-gray-700 dark:text-gray-200 ml-2">
                items
              </span>
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}; 