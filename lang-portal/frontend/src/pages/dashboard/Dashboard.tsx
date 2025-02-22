import React, { useEffect } from 'react';
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
import { useDashboardCache } from '../../hooks/useDashboardCache';

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
  const { 
    refreshAll, 
    handleSessionComplete,
    lastUpdates 
  } = useDashboardCache({
    onWarmed: () => {
      console.log('Dashboard cache warmed');
    },
    onError: (error) => {
      console.error('Dashboard cache error:', error);
    }
  });

  // Prevent excessive refetching by using a debounced refresh
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refetch();
      }, 5000); // Wait 5 seconds before allowing another refresh
    };

    window.addEventListener('session:complete', debouncedRefresh);
    return () => {
      window.removeEventListener('session:complete', debouncedRefresh);
      clearTimeout(timeoutId);
    };
  }, [refetch]);

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

  if (isError || !data) {
    return (
      <div className="p-4">
        <ApiErrorBoundary error={error}>
          <div className="text-center">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Retry Loading Dashboard
            </button>
          </div>
        </ApiErrorBoundary>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6" onKeyDown={handleKeyDown} role="main">
      <SkipLink />
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={() => refetch()}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Refresh dashboard"
        >
          <RefreshIcon className="w-5 h-5" />
        </button>
      </div>
      
      <DashboardStats 
        stats={data.stats}
        className={currentSection === 'stats' ? 'ring-2 ring-primary-500' : ''}
      />
      
      <DashboardProgress 
        progress={data.progress}
        className={currentSection === 'progress' ? 'ring-2 ring-primary-500' : ''}
      />
      
      <DashboardLatestSessions 
        sessions={data.latestSessions}
        className={currentSection === 'sessions' ? 'ring-2 ring-primary-500' : ''}
      />
    </div>
  );
} 