import React from 'react';

export interface CacheStatusProps {
  isHit: boolean;
  status: {
    timestamp: number;
    expires: number;
  } | null;
}

export const CacheStatus: React.FC<CacheStatusProps> = ({ isHit, status }) => {
  if (!status) return null;

  const timeLeft = Math.max(0, Math.round((status.expires - Date.now()) / 1000));
  
  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className={`px-2 py-1 rounded ${
        isHit ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
        'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
      }`}>
        {isHit ? 'Cache Hit' : 'Fresh Data'}
      </span>
      <span className="text-gray-600 dark:text-gray-400">
        {timeLeft}s left
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