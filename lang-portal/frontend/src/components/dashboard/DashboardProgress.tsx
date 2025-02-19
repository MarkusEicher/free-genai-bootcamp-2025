import { Card } from '../common';
import { useDashboardProgress } from '../../hooks/useApi';
import { colors } from '../../utils/colors';

interface ProgressBarProps {
  value: number;
  label: string;
  description?: string;
}

const ProgressBar = ({ value, label, description }: ProgressBarProps) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className={colors.text.secondary}>{label}</span>
      <span className={colors.text.primary}>{value.toFixed(1)}%</span>
    </div>
    <div 
      role="progressbar" 
      aria-valuenow={value} 
      aria-valuemin={0} 
      aria-valuemax={100}
      aria-label={description || label}
      className="relative h-2 bg-gray-200 rounded-full overflow-hidden"
    >
      <div
        className="absolute left-0 top-0 h-full bg-blue-600 transition-all duration-500"
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  </div>
);

interface StatCounterProps {
  label: string;
  value: number;
  total?: number;
}

const StatCounter = ({ label, value, total }: StatCounterProps) => (
  <div className="text-center">
    <dt className={`${colors.text.secondary} text-sm`}>{label}</dt>
    <dd className={`${colors.text.primary} text-2xl font-semibold`}>
      {value}
      {total && <span className="text-sm text-gray-500">/{total}</span>}
    </dd>
  </div>
);

export function DashboardProgress() {
  const { data, isLoading, isError, error } = useDashboardProgress();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="space-y-4">
            <div className="h-2 bg-gray-200 rounded-full"></div>
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  <div className="h-8 bg-gray-200 rounded w-12 mx-auto"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div role="alert" className={colors.text.error}>
          <p>{error?.message || 'Failed to load progress data'}</p>
        </div>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <h2 
          className={`${colors.text.primary} text-lg font-medium`}
          id="progress-title"
        >
          Learning Progress
        </h2>
        
        <div 
          role="region" 
          aria-labelledby="progress-title"
          className="space-y-6"
        >
          <ProgressBar
            value={data.progress_percentage}
            label="Overall Progress"
            description="Total learning progress across all activities"
          />

          <dl className="grid grid-cols-3 gap-4">
            <StatCounter
              label="Total Items"
              value={data.total_items}
            />
            <StatCounter
              label="Studied"
              value={data.studied_items}
              total={data.total_items}
            />
            <StatCounter
              label="Mastered"
              value={data.mastered_items}
              total={data.total_items}
            />
          </dl>
        </div>
      </div>
    </Card>
  );
} 