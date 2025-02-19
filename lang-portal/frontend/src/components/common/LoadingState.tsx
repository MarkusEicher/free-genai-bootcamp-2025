import React from 'react';

interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton';
  height?: string | number;
  width?: string | number;
  className?: string;
  text?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  variant = 'spinner',
  height,
  width,
  className = '',
  text = 'Loading...'
}) => {
  if (variant === 'skeleton') {
    return (
      <div
        className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        style={{ height, width }}
        role="status"
        aria-label="Loading content"
      >
        <span className="sr-only">{text}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-label="Loading content"
    >
      <svg
        className="animate-spin h-5 w-5 text-primary-600 dark:text-primary-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">{text}</span>
    </div>
  );
};

// Skeleton variants for common use cases
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 1,
  className = ''
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingState
          key={i}
          variant="skeleton"
          height={16}
          className="rounded"
          width={i === lines - 1 && lines > 1 ? '75%' : '100%'}
        />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`p-4 rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
      <LoadingState variant="skeleton" height={20} width="60%" className="mb-4" />
      <SkeletonText lines={3} className="mb-4" />
      <LoadingState variant="skeleton" height={40} className="rounded-md" />
    </div>
  );
}; 