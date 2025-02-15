interface Session {
  id: number;
  date: string;
  activities: { id: number; name: string; score: number }[];
  overallScore: number;
}

interface SessionListProps {
  sessions: Session[];
  onSessionClick: (id: number) => void;
}

export default function SessionList({ sessions, onSessionClick }: SessionListProps) {
  return (
    <div className="space-y-6">
      {sessions.map((session) => (
        <div
          key={session.id}
          onClick={() => onSessionClick(session.id)}
          className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">{session.date}</span>
            <span className="text-sm font-medium text-gray-900">
              {Math.round(session.overallScore * 100)}%
            </span>
          </div>
          <div className="space-y-2">
            {session.activities.map((activity) => (
              <div key={activity.id} className="flex justify-between items-center">
                <span className="text-gray-600">{activity.name}</span>
                <span className="text-sm text-gray-900">
                  {Math.round(activity.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
} 