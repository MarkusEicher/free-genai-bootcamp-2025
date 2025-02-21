import React, { useState } from 'react';
import { Card } from '../common/Card';
import { useCache } from '../../contexts/CacheContext';

interface ManagementActionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  isLoading: boolean;
  onClick: () => void;
}

const ManagementAction: React.FC<ManagementActionProps> = ({
  title,
  description,
  buttonText,
  buttonColor,
  isLoading,
  onClick,
}) => (
  <div className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0 mb-4 last:mb-0">
    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
      {title}
    </h4>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
      {description}
    </p>
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`${buttonColor} text-white px-4 py-2 rounded-md text-sm font-medium 
        hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 
        disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200`}
    >
      {isLoading ? 'Processing...' : buttonText}
    </button>
  </div>
);

export const CacheManagementPanel: React.FC = () => {
  const { clearCache, invalidateCache } = useCache();
  const [isClearing, setIsClearing] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [invalidationPattern, setInvalidationPattern] = useState('');

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the entire cache? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearCache();
      window.location.reload(); // Refresh the page to reflect changes
    } catch (error) {
      console.error('Failed to clear cache:', error);
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleInvalidateCache = async () => {
    if (!invalidationPattern.trim()) {
      alert('Please enter a pattern to invalidate');
      return;
    }

    setIsInvalidating(true);
    try {
      await invalidateCache(invalidationPattern);
      setInvalidationPattern('');
      alert('Cache invalidated successfully');
    } catch (error) {
      console.error('Failed to invalidate cache:', error);
      alert('Failed to invalidate cache. Please try again.');
    } finally {
      setIsInvalidating(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">
        Cache Management
      </h3>

      <div className="space-y-6">
        <div className="mb-6">
          <label
            htmlFor="invalidationPattern"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Invalidation Pattern
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="invalidationPattern"
              value={invalidationPattern}
              onChange={(e) => setInvalidationPattern(e.target.value)}
              placeholder="e.g., user.*, vocab.*"
              className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 
                bg-white dark:bg-gray-800 px-3 py-2 text-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleInvalidateCache}
              disabled={isInvalidating || !invalidationPattern.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium 
                hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isInvalidating ? 'Invalidating...' : 'Invalidate'}
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Use patterns to invalidate specific cache entries
          </p>
        </div>

        <ManagementAction
          title="Clear All Cache"
          description="Remove all cached data. This action cannot be undone."
          buttonText="Clear Cache"
          buttonColor="bg-red-600"
          isLoading={isClearing}
          onClick={handleClearCache}
        />

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Management Tips
          </h4>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• Use patterns to target specific cache entries</li>
            <li>• Clear cache during off-peak hours</li>
            <li>• Monitor performance after cache operations</li>
            <li>• Backup important data before clearing cache</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}; 