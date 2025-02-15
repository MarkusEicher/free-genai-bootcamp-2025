import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { Session } from '../../types/session'

interface PerformanceChartsProps {
  session: Session
}

export default function PerformanceCharts({ session }: PerformanceChartsProps) {
  // Prepare data for activity scores
  const activityScores = session.activities.map(activity => ({
    name: activity.name,
    score: activity.score * 100,
  }))

  // Prepare data for word performance
  const wordPerformance = {
    correct: session.words.filter(w => w.correct).length,
    incorrect: session.words.filter(w => !w.correct).length,
  }

  const wordAttempts = session.words.reduce((acc, word) => {
    const key = `${word.attempts} attempt${word.attempts !== 1 ? 's' : ''}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const attemptsData = Object.entries(wordAttempts).map(([key, value]) => ({
    name: key,
    count: value,
  }))

  return (
    <div className="space-y-6">
      {/* Activity Scores */}
      <div>
        <h4 className="font-semibold mb-2">Activity Performance</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityScores}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="score" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Word Performance Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-semibold mb-2">Word Performance</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Correct', value: wordPerformance.correct, fill: '#22c55e' },
                    { name: 'Incorrect', value: wordPerformance.incorrect, fill: '#ef4444' },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  label
                />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Attempts Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attemptsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
} 