interface StreakCalendarProps {
  data: {
    date: string
    practiceCount: number
  }[]
}

export default function StreakCalendar({ data }: StreakCalendarProps) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(today.getDate() - 30) // Show last 30 days

  const days = []
  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayData = data.find(d => d.date === dateStr)
    days.push({
      date: new Date(d),
      practiceCount: dayData?.practiceCount || 0
    })
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day, i) => (
        <div
          key={i}
          className={`
            h-8 rounded
            ${day.practiceCount > 0 
              ? 'bg-blue-500' 
              : 'bg-gray-100'
            }
            ${day.date.toDateString() === today.toDateString() 
              ? 'ring-2 ring-blue-300' 
              : ''
            }
          `}
          title={`${day.date.toLocaleDateString()}: ${day.practiceCount} practices`}
        />
      ))}
    </div>
  )
} 