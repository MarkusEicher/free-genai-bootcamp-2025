import { useSessions } from '../hooks/useApi'
import { SessionCalendar } from '../components/SessionCalendar'
import { SessionStats } from '../components/SessionStats'
import { SessionList } from '../components/SessionList'

export default function SessionsPage() {
  const { data: sessions, isLoading } = useSessions()

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Learning Sessions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SessionCalendar sessions={sessions || []} />
        </div>
        <div>
          <SessionStats sessions={sessions || []} />
        </div>
      </div>

      <SessionList sessions={sessions || []} />
    </div>
  )
} 