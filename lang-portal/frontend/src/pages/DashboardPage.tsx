import { DashboardStats } from '../components/dashboard/DashboardStats';
import { DashboardProgress } from '../components/dashboard/DashboardProgress';
import { LatestSessions } from '../components/dashboard/LatestSessions';
import { useDashboardData } from '../hooks/useApi';
import { RefreshIcon } from '../components/icons/RefreshIcon';

export default function DashboardPage() {
  const { isLoading, isError, error, refetch } = useDashboardData();

  return (
    <main 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      aria-busy={isLoading}
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

      {isError ? (
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
      ) : (
        <div className="space-y-8">
          <section 
            aria-labelledby="stats-heading"
            className="bg-white rounded-lg shadow-sm"
          >
            <h2 id="stats-heading" className="sr-only">Dashboard Statistics</h2>
            <DashboardStats />
          </section>

          <section 
            aria-labelledby="progress-heading"
            className="bg-white rounded-lg shadow-sm"
          >
            <h2 id="progress-heading" className="sr-only">Learning Progress</h2>
            <DashboardProgress />
          </section>

          <section 
            aria-labelledby="activity-heading"
            className="bg-white rounded-lg shadow-sm"
          >
            <h2 id="activity-heading" className="sr-only">Recent Activity</h2>
            <LatestSessions />
          </section>
        </div>
      )}
    </main>
  );
} 