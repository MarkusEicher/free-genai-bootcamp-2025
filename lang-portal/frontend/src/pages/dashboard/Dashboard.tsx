import { useEffect } from 'react';
import { DashboardStats } from './components/DashboardStats';
import { DashboardProgress } from './components/DashboardProgress';
import { DashboardLatestSessions } from './components/DashboardLatestSessions';
import { useDashboardData } from '../../hooks/useApi';
import { RefreshIcon } from '../../components/icons/RefreshIcon';
import { SkeletonCard } from '../../components/common/LoadingState';
import { ApiErrorBoundary } from '../../components/error/ApiErrorBoundary';
import { SkipLink } from '../../components/common/SkipLink';
import { useDashboardKeyboardNav } from '../../hooks/useDashboardKeyboardNav';
import { logger } from '../../utils/logger';

export default function Dashboard() {
  const { data, isLoading, isError, error, refetch } = useDashboardData();
  const { currentSection, handleKeyDown } = useDashboardKeyboardNav();

  // Log component mount
  useEffect(() => {
    logger.info('Dashboard', 'Dashboard component mounted');
    return () => {
      logger.info('Dashboard', 'Dashboard component unmounted');
    };
  }, []);

  // Refresh data when session completes
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const debouncedRefresh = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logger.info('Dashboard', 'Refreshing dashboard data');
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
    logger.info('Dashboard', 'Loading dashboard data');
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
    logger.error('Dashboard', 'Failed to load dashboard', error as Error);
    return (
      <div className="p-4">
        <ApiErrorBoundary onError={(error) => logger.error('Dashboard', 'Error boundary caught error', error)}>
          <div className="text-center">
            <button
              onClick={() => {
                logger.info('Dashboard', 'Retrying dashboard load');
                refetch();
              }}
              className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
            >
              Retry Loading Dashboard
            </button>
          </div>
        </ApiErrorBoundary>
      </div>
    );
  }

  logger.info('Dashboard', 'Dashboard data loaded successfully', {
    stats: {
      studySessions: data.stats.study_sessions_count,
      activeActivities: data.stats.active_activities_count,
      currentStreak: data.stats.study_streak.current_streak
    }
  });

  return (
    <div className="p-4 space-y-6" onKeyDown={handleKeyDown} role="main">
      <SkipLink targetId="dashboard-content">Skip to dashboard content</SkipLink>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <button
          onClick={() => {
            logger.info('Dashboard', 'Manual dashboard refresh requested');
            refetch();
          }}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label="Refresh dashboard"
        >
          <RefreshIcon />
        </button>
      </div>
      
      <div id="dashboard-content">
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
    </div>
  );
} 