import { useParams } from 'react-router-dom'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useSession, usePreviousSession } from '../hooks/useApi'
import type { Session, SessionActivity } from '../types/sessions'
import { SessionComparison } from '../components/SessionComparison'

export default function SessionDetailsPage() {
  const { id } = useParams()
  const { data: session, isLoading, isError } = useSession(Number(id))
  const { data: previousSession } = usePreviousSession(Number(id))

  const exportSession = (session: Session) => {
    const data = {
      date: new Date(session.startTime).toLocaleDateString(),
      duration: `${Math.round(session.duration / 60)} minutes`,
      score: `${Math.round(session.score * 100)}%`,
      activities: session.activities.map(a => ({
        name: a.name,
        score: `${Math.round(a.score * 100)}%`,
        duration: `${Math.round(a.duration / 60)} minutes`
      }))
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `session-${id}-report.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <LoadingSpinner />
  if (isError || !session) return <div>Error loading session</div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Session: {new Date(session.startTime).toLocaleDateString()}
        </h1>
        <Button onClick={() => exportSession(session)}>
          Export Report
        </Button>
      </div>

      {/* Session Overview */}
      <Card className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Duration</h3>
            <p className="mt-1 text-2xl font-semibold">
              {Math.round(session.duration / 60)}m
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Score</h3>
            <p className="mt-1 text-2xl font-semibold">
              {Math.round(session.score * 100)}%
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Activities</h3>
            <p className="mt-1 text-2xl font-semibold">
              {session.activitiesCompleted}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Time of Day</h3>
            <p className="mt-1 text-2xl font-semibold">
              {new Date(session.startTime).toLocaleTimeString()}
            </p>
          </div>
        </div>
      </Card>

      {/* Comparison (if previous session exists) */}
      {previousSession && (
        <SessionComparison
          currentSession={session}
          previousSession={previousSession}
        />
      )}

      {/* Activities List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Activities Completed</h2>
        {session.activities.map((activity: SessionActivity) => (
          <Card key={activity.id} className="p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">{activity.name}</h3>
                <p className="text-sm text-gray-500">
                  Duration: {Math.round(activity.duration / 60)} minutes
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium">
                  {Math.round(activity.score * 100)}%
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
} 