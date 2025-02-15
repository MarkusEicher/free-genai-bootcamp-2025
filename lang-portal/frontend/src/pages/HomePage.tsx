import { useProfile, useStats } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'
import ProgressChart from '../components/ProgressChart'
import type { Activity } from '../types/activities'

export default function HomePage() {
  const { data: profile, isLoading: profileLoading } = useProfile()
  const { data: stats, isLoading: statsLoading } = useStats()

  if (profileLoading || statsLoading) {
    return <LoadingState />
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {profile?.name}</h1>
      
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
        <ProgressChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Today's Goals</h2>
          <p>Daily practice goal: {profile?.dailyGoal || 0} minutes</p>
          <p>Progress: {stats?.todayMinutes || 0} minutes</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Recent Activity</h2>
          <div className="space-y-2">
            {stats?.recentActivity?.map((activity: Activity, index: number) => (
              <div key={index} className="flex justify-between items-center">
                <span>{activity.type}</span>
                <span className="text-gray-500">
                  {new Date(activity.date).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 