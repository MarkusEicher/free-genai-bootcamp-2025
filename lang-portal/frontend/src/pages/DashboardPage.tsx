import { DashboardStats } from '../components/dashboard/DashboardStats';
import { DashboardProgress } from '../components/dashboard/DashboardProgress';
import { LatestSessions } from '../components/dashboard/LatestSessions';
import { useDashboardData } from '../hooks/useApi';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { isLoading, isError, error, refetch } = useDashboardData();

  return (
    <main 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      aria-busy={isLoading}
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          aria-label={isLoading ? "Refreshing dashboard" : "Refresh dashboard"}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 focus:ring-2 focus:ring-blue-500 focus:outline-none rounded"
        >
          <ArrowPathIcon 
            className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {isError ? (
        <div role="alert" className="p-6 border-l-4 border-red-500 bg-red-50">
          <div className="mb-4 text-red-700">
            {error?.message || 'Failed to load dashboard'}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 focus:outline-none"
          >
            Retry Loading Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <section aria-label="Dashboard Statistics">
            <DashboardStats />
          </section>
          <section aria-label="Learning Progress">
            <DashboardProgress />
          </section>
          <section aria-label="Recent Activity">
            <LatestSessions />
          </section>
        </div>
      )}
    </main>
  );
} 