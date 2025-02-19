import { Card } from '../common';
import { useDashboardProgress } from '../../hooks/useApi';

export function DashboardProgress() {
  const { data, isLoading, isError, error } = useDashboardProgress();

  if (isLoading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-6 text-red-500">
        <p>{error?.message || 'Failed to load progress data'}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Learning Progress</h2>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{data.progress_percentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${data.progress_percentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-semibold">{data.total_items}</p>
            <p className="text-sm text-gray-500">Total Items</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{data.studied_items}</p>
            <p className="text-sm text-gray-500">Studied</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{data.mastered_items}</p>
            <p className="text-sm text-gray-500">Mastered</p>
          </div>
        </div>
      </div>
    </Card>
  );
} 