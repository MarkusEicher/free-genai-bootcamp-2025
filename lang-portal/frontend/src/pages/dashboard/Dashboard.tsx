import React from 'react';
import { DashboardStats } from './components/DashboardStats';
import { DashboardProgress } from './components/DashboardProgress';
import { DashboardLatestSessions } from './components/DashboardLatestSessions';
import { useDashboardData } from '../../hooks/useApi';
import { RefreshIcon } from '../../components/icons/RefreshIcon';
import { useLoadingState } from '../../hooks/useLoadingState';
import { SkeletonCard } from '../../components/common/LoadingState';
import { ApiErrorBoundary } from '../../components/error/ApiErrorBoundary';
import { SkipLink } from '../../components/common/SkipLink';
import { dashboardApi } from '../../api/dashboard';
import type { DashboardData } from '../../types/dashboard';
import { useDashboardKeyboardNav } from '../../hooks/useDashboardKeyboardNav';

const DashboardContent: React.FC<{
  data: DashboardData;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
}> = ({ data, isError, error, refetch }) => {
  if (isError) {
    return (
      <div 
        role="alert" 
        aria-live="assertive"
        className="p-6 border-l-4 border-red-700 bg-red-50"
      >
        <div className="mb-4 text-red-900 font-medium">
          {error?.message || 'Failed to load dashboard'}
        </div>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Retry Loading Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section 
        aria-labelledby="stats-heading"
        className="bg-white rounded-lg shadow-sm"
      >
        <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
        <DashboardStats stats={data.stats} />
      </section>

      <section 
        aria-labelledby="progress-heading"
        className="bg-white rounded-lg shadow-sm"
      >
        <h2 id="progress-heading" className="sr-only">Learning Progress</h2>
        <DashboardProgress progress={data.progress} />
      </section>

      <section 
        aria-labelledby="activity-heading"
        className="bg-white rounded-lg shadow-sm"
      >
        <h2 id="activity-heading" className="sr-only">Recent Activity</h2>
        <DashboardLatestSessions sessions={data.latestSessions} />
      </section>
    </div>
  );
};

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardData();
  const { currentSection, handleKeyDown } = useDashboardKeyboardNav();

  if (isLoading) {
    return (
      <div className="p-4 space-y-4" role="status" aria-label="Loading dashboard">
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard className="h-64" />
      </div>
    );
  }

  return (
    <main 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      aria-busy={isLoading}
      onKeyDown={handleKeyDown}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold text-gray-900" tabIndex={-1}>
          Learning Dashboard
        </h1>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          aria-label={isLoading ? "Refreshing dashboard" : "Refresh dashboard"}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshIcon />
          <span className="text-base">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      <DashboardContent 
        data={data}
        isError={isError}
        error={error}
        refetch={refetch}
      />
    </main>
  );
} 