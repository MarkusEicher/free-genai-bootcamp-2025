import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface CacheStatusProps {
  isCacheHit: boolean;
  timestamp?: number;
  expires?: number;
  className?: string;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({
  isCacheHit,
  timestamp,
  expires,
  className = ''
}) => {
  if (!isCacheHit || !timestamp) {
    return null;
  }

  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
  const isExpiringSoon = expires && expires - Date.now() < 60000; // Less than 1 minute

  return (
    <div 
      className={`inline-flex items-center text-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className={`
        inline-block w-2 h-2 rounded-full mr-2
        ${isExpiringSoon ? 'bg-yellow-500' : 'bg-green-500'}
      `} />
      <span className="text-gray-600 dark:text-gray-300">
        Cached {timeAgo}
      </span>
    </div>
  );
};

export const CacheIndicator: React.FC<{ hit: boolean }> = ({ hit }) => (
  <span 
    className={`
      inline-flex items-center px-2 py-1 rounded text-xs font-medium
      ${hit ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300' : 
             'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300'}
    `}
    role="status"
  >
    {hit ? 'Cache Hit' : 'Cache Miss'}
  </span>
); 