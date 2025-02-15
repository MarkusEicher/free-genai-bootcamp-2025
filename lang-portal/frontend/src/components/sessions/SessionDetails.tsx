import { format } from 'date-fns'
import { Card, Button } from '../common'
import { Session, Activity } from '../../types/session'
import ActivityDetailsComponent from './ActivityDetails'
import PerformanceCharts from './PerformanceCharts'

interface SessionDetailsProps {
  session: Session
  onClose: () => void
}

interface ActivityCardProps {
  activity: Activity
}

const ActivityCard = ({ activity }: ActivityCardProps) => {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'quiz': return '📝'
      case 'flashcard': return '🎴'
      case 'writing': return '✍️'
      case 'reading': return '📚'
      default: return '📋'
    }
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
        <div className="flex-grow">
          <h4 className="font-semibold">{activity.name}</h4>
          <p className="text-sm text-gray-600">
            Completed {format(new Date(activity.completedAt), 'pp')}
          </p>
        </div>
        <div className="text-lg font-bold">
          <span className={`${
            activity.score >= 0.8 ? 'text-green-600' :
            activity.score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {(activity.score * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export default function SessionDetails({ session, onClose }: SessionDetailsProps) {
  const totalWords = session.words.length
  const correctWords = session.words.filter(w => w.correct).length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center overflow-y-auto p-4">
      <Card className="w-full max-w-4xl">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Session Details</h2>
              <p className="text-gray-600">
                {format(new Date(session.date), 'PPPP')}
              </p>
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="p-6 border-b">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-sm text-gray-600">Overall Score</div>
              <div className="text-2xl font-bold text-blue-600">
                {(session.overallScore * 100).toFixed(1)}%
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-sm text-gray-600">Words Mastered</div>
              <div className="text-2xl font-bold text-green-600">
                {correctWords}/{totalWords}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-2xl font-bold text-purple-600">
                {session.duration}m
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-sm text-gray-600">Streak</div>
              <div className="text-2xl font-bold text-orange-600">
                {session.streak} 🔥
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Performance Analysis</h3>
          <PerformanceCharts session={session} />
        </div>

        {/* Activities with Details */}
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Activities</h3>
          <div className="space-y-4">
            {session.activities.map(activity => (
              <div key={activity.id}>
                <ActivityCard activity={activity} />
                <ActivityDetailsComponent activity={activity} />
              </div>
            ))}
          </div>
        </div>

        {/* Words Practiced */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Words Practiced</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {session.words.map(word => (
              <div 
                key={word.id}
                className={`p-3 rounded-lg border ${
                  word.correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{word.word}</div>
                    <div className="text-gray-600">{word.translation}</div>
                  </div>
                  <div className="text-sm">
                    {word.correct ? (
                      <span className="text-green-600">✓ Correct</span>
                    ) : (
                      <span className="text-red-600">✗ Incorrect</span>
                    )}
                    <div className="text-gray-500">
                      {word.attempts} attempt{word.attempts !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
} 