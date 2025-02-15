import { Card } from './common'
import type { Session } from '../types/sessions'

interface SessionListProps {
  sessions: Session[]
}

export function SessionList({ sessions }: SessionListProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Recent Sessions</h2>
      <div className="space-y-4">
        {sessions.slice(0, 10).map(session => (
          <div
            key={session.id}
            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="font-medium">
                {new Date(session.date).toLocaleDateString()}
              </div>
              <div className="text-sm text-gray-500">
                {session.activities.map(a => a.name).join(', ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-medium">
                {Math.round(session.score * 100)}%
              </div>
              <div className="text-sm text-gray-500">
                {Math.round(session.duration / 60)} minutes
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
} 