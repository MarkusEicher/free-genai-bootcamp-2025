import { useNavigate, useParams } from 'react-router-dom'
import { Card, Button } from '../components/common'
import { useActivity, useActivityProgress } from '../hooks/useApi'
import confetti from 'canvas-confetti'
import { useEffect } from 'react'

export default function ActivityCompletePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: activity } = useActivity(Number(id))
  const { data: progress } = useActivityProgress(Number(id))

  useEffect(() => {
    // Trigger confetti animation
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
  }, [])

  const averageScore = progress?.recent?.reduce(
    (acc: number, entry: { score?: number }) => acc + (entry.score || 0), 
    0
  ) / (progress?.recent?.length || 1)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 text-center">
      <h1 className="text-3xl font-bold">Congratulations! 🎉</h1>
      <p className="text-xl text-gray-600">
        You've completed {activity?.name}
      </p>

      {/* Performance Summary */}
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-gray-500">Average Score</div>
            <div className="text-2xl font-bold">
              {Math.round(averageScore * 100)}%
            </div>
          </div>
          <div>
            <div className="text-gray-500">Time Spent</div>
            <div className="text-2xl font-bold">
              {progress?.totalTime ? Math.round(progress.totalTime / 60) : 0} min
            </div>
          </div>
        </div>
      </Card>

      {/* Achievement Unlocked */}
      {progress?.achievements?.map((achievement: { name: string; description: string }, index: number) => (
        <Card key={index} className="p-6 bg-yellow-50">
          <div className="text-lg font-medium text-yellow-800">
            🏆 Achievement Unlocked!
          </div>
          <div className="text-yellow-700">{achievement.name}</div>
          <div className="text-sm text-yellow-600">{achievement.description}</div>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="secondary"
          onClick={() => navigate('/activities')}
        >
          Back to Activities
        </Button>
        <Button
          onClick={() => navigate(`/activities/${id}`)}
        >
          View Details
        </Button>
      </div>
    </div>
  )
} 