import { useState } from 'react'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useActivities, useStartActivity } from '../hooks/useApi'
import type { ActivityDetailsType } from '../types/session'
import StatisticsChart from '../components/activities/StatisticsChart'
import AchievementsList from '../components/activities/AchievementsList'
import { useAchievements, useBadges, useActivityStats } from '../hooks/useApi'

type ActivityFilter = 'all' | keyof ActivityDetailsType
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

interface PrerequisiteError {
  activityId: number
  missingPrerequisites: number[]
}

export default function Activities() {
  const [prerequisiteError, setPrerequisiteError] = useState<PrerequisiteError | null>(null)
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null)
  const startActivity = useStartActivity()
  const [filter, setFilter] = useState<ActivityFilter>('all')
  const [difficulty, setDifficulty] = useState<DifficultyLevel | 'all'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const { data: activities, isLoading, isError, refetch } = useActivities()
  const { data: achievements } = useAchievements()
  const { data: badges } = useBadges()

  const filteredActivities = activities?.filter(activity => {
    const matchesFilter = filter === 'all' || activity.type === filter
    const matchesDifficulty = difficulty === 'all' || activity.difficulty === difficulty
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesDifficulty && matchesSearch
  })

  const handleStartActivity = async (activityId: number, prerequisites?: number[]) => {
    // Check prerequisites
    if (prerequisites?.length) {
      const missingPrerequisites = prerequisites.filter(preReqId => {
        const preReqActivity = activities?.find(a => a.id === preReqId)
        return !preReqActivity || preReqActivity.progress < 1
      })

      if (missingPrerequisites.length > 0) {
        setPrerequisiteError({ activityId, missingPrerequisites })
        return
      }
    }

    try {
      await startActivity.mutateAsync(activityId)
      // Redirect to activity page or show modal
      window.location.href = `/activity/${activityId}`
    } catch (error) {
      console.error('Failed to start activity:', error)
    }
  }

  if (isLoading) return <LoadingSpinner />

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading activities</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Learning Activities</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded"
          />
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Activity Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              All
            </button>
            {['quiz', 'flashcard', 'writing', 'reading'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type as ActivityFilter)}
                className={`px-4 py-2 rounded ${
                  filter === type ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Difficulty</label>
          <div className="flex gap-2">
            {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level as DifficultyLevel | 'all')}
                className={`px-4 py-2 rounded ${
                  difficulty === level ? 'bg-blue-600 text-white' : 'bg-gray-200'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredActivities?.map(activity => (
          <Card 
            key={activity.id} 
            className="p-6"
            onClick={() => setSelectedActivity(activity.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{activity.name}</h3>
                <p className="text-gray-600">{activity.description}</p>
              </div>
              <span className={`px-3 py-1 rounded text-sm ${
                activity.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                activity.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {activity.difficulty}
              </span>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-sm text-gray-600">Completed</div>
                <div className="font-semibold">{activity.stats.completed}</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-sm text-gray-600">Avg. Score</div>
                <div className="font-semibold">
                  {(activity.stats.averageScore * 100).toFixed(1)}%
                </div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded">
                <div className="text-sm text-gray-600">Time Spent</div>
                <div className="font-semibold">{activity.stats.timeSpent}m</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-sm text-gray-600">Est. Time</div>
                <div className="font-semibold">{activity.estimatedTime}m</div>
              </div>
            </div>

            {/* Last Attempt */}
            {activity.stats.lastAttempt && (
              <div className="text-sm text-gray-600 mb-4">
                Last attempt: {new Date(activity.stats.lastAttempt).toLocaleDateString()}
              </div>
            )}

            {/* Prerequisites Warning */}
            {activity.prerequisites && activity.prerequisites.length > 0 && (
              <div className="mb-4 text-sm">
                <span className="font-medium">Prerequisites: </span>
                {activities
                  ?.filter(a => activity.prerequisites?.includes(a.id))
                  .map(a => a.name)
                  .join(', ')}
              </div>
            )}

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="h-2 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-600"
                  style={{ width: `${activity.progress * 100}%` }}
                />
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Progress: {(activity.progress * 100).toFixed(0)}%
              </div>
            </div>

            <Button
              onClick={() => handleStartActivity(activity.id, activity.prerequisites)}
              className="w-full"
              disabled={startActivity.isPending}
            >
              {startActivity.isPending ? 'Starting...' : 'Start Activity'}
            </Button>
          </Card>
        ))}
      </div>

      {/* Prerequisites Error Modal */}
      {prerequisiteError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Prerequisites Required</h3>
            <p className="mb-4">
              Please complete the following activities first:
            </p>
            <ul className="list-disc list-inside mb-4">
              {prerequisiteError.missingPrerequisites.map(preReqId => {
                const preReqActivity = activities?.find(a => a.id === preReqId)
                return (
                  <li key={preReqId} className="mb-2">
                    {preReqActivity?.name}
                    {preReqActivity && (
                      <span className="text-gray-600">
                        {' '}
                        ({(preReqActivity.progress * 100).toFixed(0)}% completed)
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <Button onClick={() => setPrerequisiteError(null)} className="w-full">
              Close
            </Button>
          </Card>
        </div>
      )}

      {/* Statistics Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Performance Analytics</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <StatisticsChart
            data={selectedActivity ? useActivityStats(selectedActivity).data?.history : []}
            metric="score"
          />
          <StatisticsChart
            data={selectedActivity ? useActivityStats(selectedActivity).data?.history : []}
            metric="timeSpent"
          />
          <StatisticsChart
            data={selectedActivity ? useActivityStats(selectedActivity).data?.history : []}
            metric="accuracy"
            chartType="bar"
          />
        </div>
      </div>

      {/* Achievements Section */}
      {achievements && badges && (
        <div className="bg-white rounded-lg shadow p-6">
          <AchievementsList
            achievements={achievements}
            badges={badges}
          />
        </div>
      )}
    </div>
  )
} 