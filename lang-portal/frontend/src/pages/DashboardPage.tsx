import { useStats } from '../hooks/useApi'
import LoadingState from '../components/LoadingState'
import Card from '../components/Card'
import ProgressChart from '../components/charts/ProgressChart'
import StreakCalendar from '../components/charts/StreakCalendar'
import StatsCard from '../components/StatsCard'

interface ProgressHistory {
  date: string
  wordsLearned: number
  successRate: number
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useStats()

  if (isLoading) {
    return <LoadingState />
  }

  const progressData = {
    dates: stats?.progressHistory.map((h: ProgressHistory) => h.date) || [],
    wordsLearned: stats?.progressHistory.map((h: ProgressHistory) => h.wordsLearned) || [],
    successRate: stats?.progressHistory.map((h: ProgressHistory) => h.successRate) || []
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard
          title="Words Learned"
          value={stats?.wordsLearned || 0}
          description="Total words mastered"
          trend={5}
        />
        <StatsCard
          title="Current Streak"
          value={`${stats?.currentStreak || 0} days`}
          description="Keep practicing!"
          trend={0}
        />
        <StatsCard
          title="Success Rate"
          value={`${Math.round(stats?.successRate || 0)}%`}
          description="Average correct answers"
          trend={2}
        />
        <StatsCard
          title="Practice Time"
          value={`${stats?.totalMinutes || 0} min`}
          description="Total time learning"
          trend={10}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Learning Progress</h2>
          <ProgressChart data={progressData} />
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-medium mb-4">Practice Streak</h2>
          <StreakCalendar data={stats?.streakData || []} />
        </Card>
      </div>
    </div>
  )
} 