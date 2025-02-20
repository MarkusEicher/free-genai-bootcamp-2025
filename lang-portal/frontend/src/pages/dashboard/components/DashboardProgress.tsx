import React, { useRef, useEffect } from 'react';
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
              className="text-sm font-medium text-gray-900 dark:text-gray-100"
              id={`progress-label-${label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              {label}
            </span>
          </div>
          <div 
            className="text-sm text-gray-600 dark:text-gray-400"
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
  progress: DashboardProgressType;
}

export const DashboardProgress: React.FC<DashboardProgressProps> = ({ progress }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Ensure numeric values
  const progressPercentage = typeof progress.progress_percentage === 'number' ? progress.progress_percentage : 0;
  const totalItems = typeof progress.total_items === 'number' ? progress.total_items : 0;
  const masteredItems = typeof progress.mastered_items === 'number' ? progress.mastered_items : 0;
  const studiedItems = typeof progress.studied_items === 'number' ? progress.studied_items : 0;
  const inProgressItems = studiedItems - masteredItems;

  return (
    <div 
      ref={containerRef}
      className="p-6 space-y-6"
      role="region"
      aria-label="Learning Progress"
      tabIndex={0}
    >
      <div className="space-y-2">
        <h3 
          className="text-lg font-medium text-gray-900 dark:text-gray-100"
          id="progress-section-title"
        >
          Overall Progress
        </h3>
        <p 
          className="text-sm text-gray-500 dark:text-gray-400"
          id="progress-section-description"
        >
          Track your learning journey progress
        </p>
      </div>

      <div 
        className="space-y-4"
        aria-labelledby="progress-section-title"
        aria-describedby="progress-section-description"
      >
        <ProgressBar
          percentage={progressPercentage}
          label="Total Progress"
          color="var(--color-primary-600)"
        />

        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
          role="list"
          aria-label="Progress Details"
        >
          <div 
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
            role="listitem"
          >
            <h4 
              className="text-sm font-medium text-gray-500 dark:text-gray-400"
              id="mastered-items-label"
            >
              Items Mastered
            </h4>
            <p 
              className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100"
              aria-labelledby="mastered-items-label"
            >
              {masteredItems.toString()}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                / {totalItems.toString()}
              </span>
            </p>
          </div>

          <div 
            className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4"
            role="listitem"
          >
            <h4 
              className="text-sm font-medium text-gray-500 dark:text-gray-400"
              id="in-progress-items-label"
            >
              Items in Progress
            </h4>
            <p 
              className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100"
              aria-labelledby="in-progress-items-label"
            >
              {inProgressItems.toString()}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
                items
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* SVG Visualization */}
      <div 
        className="mt-6" 
        role="img" 
        aria-label={`Progress visualization: ${progressPercentage.toFixed(1)}% complete`}
      >
        <svg
          className="w-full h-24"
          viewBox="0 0 400 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Background */}
          <rect
            x="0"
            y="20"
            width="400"
            height="60"
            fill="var(--color-gray-200)"
            className="dark:fill-gray-700"
          />
          
          {/* Progress Bar */}
          <rect
            x="0"
            y="20"
            width={400 * (progressPercentage / 100)}
            height="60"
            fill="var(--color-primary-600)"
            className="transition-all duration-500 ease-in-out"
          >
            <title>Progress: {progressPercentage.toFixed(1)}%</title>
          </rect>

          {/* Mastery Marker */}
          <line
            x1={400 * 0.8}
            y1="0"
            x2={400 * 0.8}
            y2="100"
            stroke="var(--color-gray-400)"
            strokeDasharray="4,4"
            strokeWidth="2"
          >
            <title>Mastery Level: 80%</title>
          </line>
        </svg>
      </div>
    </div>
  );
}; 