import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useActivity, useActivityProgress } from '../hooks/useApi'

export default function ActivityDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: activity, isLoading, isError } = useActivity(Number(id))
  const { data: progress } = useActivityProgress(Number(id))

  if (isLoading) return <LoadingSpinner />
  if (isError || !activity) return <div>Error loading activity</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{activity.name}</h1>
          <p className="text-gray-500">{activity.type}</p>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate('/activities')}
        >
          Back to Activities
        </Button>
      </div>

      {/* Progress Overview */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Progress</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span>Overall Progress</span>
            <span className="font-medium">{Math.round(activity.progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${activity.progress * 100}%` }}
            />
          </div>
          {activity.completedSteps !== undefined && (
            <div className="text-sm text-gray-500">
              {activity.completedSteps} of {activity.totalSteps} steps completed
            </div>
          )}
        </div>
      </Card>

      {/* Activity Details */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Details</h2>
        {activity.description && (
          <p className="text-gray-700 mb-4">{activity.description}</p>
        )}
        {activity.goals && activity.goals.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Goals:</h3>
            <ul className="list-disc list-inside space-y-1">
              {activity.goals.map((goal: string, index: number) => (
                <li key={index} className="text-gray-700">{goal}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Recent Progress */}
      {progress && progress.recent && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Progress</h2>
          <div className="space-y-4">
            {progress.recent.map((entry: any, index: number) => (
              <div key={index} className="flex justify-between items-center py-2 border-b">
                <div>
                  <div className="font-medium">{entry.action}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </div>
                </div>
                {entry.score !== undefined && (
                  <div className={`px-2 py-1 rounded-full text-sm ${
                    entry.score > 0.8 ? 'bg-green-100 text-green-800' :
                    entry.score > 0.5 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {Math.round(entry.score * 100)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-4">
        <Button
          variant="secondary"
          onClick={() => navigate(`/activities/${id}/edit`)}
        >
          Edit Activity
        </Button>
        <Button
          onClick={() => navigate(`/activities/${id}/practice`)}
        >
          Continue Activity
        </Button>
      </div>
    </div>
  )
} 