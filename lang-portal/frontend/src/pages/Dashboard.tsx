import { useState } from 'react'
import { Card, Button, LoadingSpinner } from '../components/common'
import { useVocabulary, useSessions } from '../hooks/useApi'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('week') // 'week' | 'month' | 'year'
  const { 
    data: vocabulary,
    isLoading: vocabLoading,
    isError: vocabError,
    refetch: refetchVocab
  } = useVocabulary()
  
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions
  } = useSessions()

  const isLoading = vocabLoading || sessionsLoading
  const hasError = vocabError || sessionsError

  const stats = [
    {
      label: 'Total Words',
      value: vocabulary?.length.toString() || '0',
      change: '+5 this week'
    },
    {
      label: 'Sessions Completed',
      value: sessions?.length.toString() || '0',
      change: '+2 this week'
    },
    {
      label: 'Average Score',
      value: '85%'
    }
  ]

  // Progress data for chart
  const progressData = sessions?.map(session => ({
    date: new Date(session.date).toLocaleDateString(),
    score: session.overallScore * 100
  })) || []

  const handleRefresh = async () => {
    await Promise.all([refetchVocab(), refetchSessions()])
  }

  if (isLoading) return <LoadingSpinner />

  if (hasError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Error loading dashboard data</p>
        <Button onClick={handleRefresh}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-4">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <Button onClick={handleRefresh}>Refresh</Button>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map(stat => (
          <Card key={stat.label} className="p-4">
            <div className="text-sm text-gray-600">{stat.label}</div>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.change && (
              <div className="text-sm text-green-600">{stat.change}</div>
            )}
          </Card>
        ))}
      </div>

      {/* Progress Chart */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Learning Progress</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={progressData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#2563eb" 
                strokeWidth={2} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {sessions && sessions.length > 0 ? (
          <div className="space-y-2">
            {sessions.slice(0, 3).map(session => (
              <div key={session.id} className="flex justify-between items-center">
                <span>{new Date(session.date).toLocaleDateString()}</span>
                <span className="text-green-600">{session.overallScore * 100}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No recent activity</p>
        )}
      </Card>
    </div>
  )
} 