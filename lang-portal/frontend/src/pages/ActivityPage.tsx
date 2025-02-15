import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useActivities, useActivityStats } from '../hooks/useApi'
import type { Activity } from '../types/activities'

export default function ActivityPage() {
  const navigate = useNavigate()
  const { data: activities, isLoading, isError } = useActivities()
  const { data: stats } = useActivityStats()
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  if (isLoading) return <LoadingSpinner />
  if (isError) return <div>Error loading activities</div>

  const filteredActivities = activities?.filter((activity: Activity) => {
    if (filter === 'active') return activity.progress < 1
    if (filter === 'completed') return activity.progress === 1
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Activities</h1>
        <Button onClick={() => navigate('/activities/new')}>
          Start New Activity
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-500">Total Activities</div>
          <div className="text-2xl font-bold">{stats?.totalActivities || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.completedActivities || 0}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-500">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stats?.inProgressActivities || 0}
          </div>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex gap-2">
        {(['all', 'active', 'completed'] as const).map(option => (
          <Button
            key={option}
            variant={filter === option ? 'primary' : 'secondary'}
            onClick={() => setFilter(option)}
          >
            {option.charAt(0).toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>

      {/* Activities List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities?.map((activity: Activity) => (
          <Card
            key={activity.id}
            className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate(`/activities/${activity.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium">{activity.name}</h3>
                <p className="text-sm text-gray-500">{activity.type}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-sm ${
                activity.progress === 1 
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {activity.progress === 1 ? 'Completed' : 'In Progress'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(activity.progress * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${activity.progress * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-500">
              Last updated: {new Date(activity.updatedAt).toLocaleDateString()}
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No activities found</p>
          <Button onClick={() => navigate('/activities/new')}>
            Start Your First Activity
          </Button>
        </div>
      )}
    </div>
  )
} 