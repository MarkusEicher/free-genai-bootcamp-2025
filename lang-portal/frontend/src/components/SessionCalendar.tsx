import { Card } from './common'
import type { Session } from '../types/sessions'

interface SessionCalendarProps {
  sessions: Session[]
}

export function SessionCalendar({ sessions }: SessionCalendarProps) {
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const days = Array.from({ length: lastDayOfMonth.getDate() }, (_, i) => i + 1)

  const getSessionForDay = (day: number) => {
    const date = new Date(today.getFullYear(), today.getMonth(), day)
    return sessions.find(s => new Date(s.date).toDateString() === date.toDateString())
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-medium mb-4">Activity Calendar</h2>
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="text-center text-sm text-gray-500">
            {day}
          </div>
        ))}
        {Array.from({ length: firstDayOfMonth.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map(day => {
          const session = getSessionForDay(day)
          return (
            <div
              key={day}
              className={`aspect-square flex items-center justify-center rounded-lg text-sm
                ${session
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-50 text-gray-500'}`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </Card>
  )
} 