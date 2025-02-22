import React from 'react';
import { Card } from '../../../components/common/Card';
import type { DashboardProgress as DashboardProgressType } from '../../../types/dashboard';

interface ProgressBarProps {
  percentage: number;
  label: string;
  color?: string;
  showLabel?: boolean;
}

interface DashboardProgressProps {
  progress: DashboardProgressType;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  label,
  color = 'bg-primary-600',
  showLabel = true
}) => (
  <div className="relative pt-1">
    <div className="flex items-center justify-between">
      {showLabel && (
        <div>
          <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
            {label}
          </span>
        </div>
      )}
      <div className="text-right">
        <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
      <div
        style={{ width: `${percentage}%` }}
        className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${color}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label}: ${percentage.toFixed(1)}%`}
      />
    </div>
  </div>
);

export const DashboardProgress: React.FC<DashboardProgressProps> = ({ progress, className = '' }) => {
  const studiedPercentage = (progress.studied_items / progress.total_items) * 100 || 0;
  const masteredPercentage = (progress.mastered_items / progress.total_items) * 100 || 0;

  return (
    <Card className={`p-6 ${className}`}>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Learning Progress
      </h2>
      
      <div className="space-y-6">
        <div>
          <ProgressBar
            label="Overall Progress"
            percentage={progress.progress_percentage}
            color="bg-primary-600"
          />
        </div>
        
        <div>
          <ProgressBar
            label="Items Studied"
            percentage={studiedPercentage}
            color="bg-blue-500"
          />
        </div>
        
        <div>
          <ProgressBar
            label="Items Mastered"
            percentage={masteredPercentage}
            color="bg-green-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {progress.total_items}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Items
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {progress.studied_items}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Studied
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {progress.mastered_items}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Mastered
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 