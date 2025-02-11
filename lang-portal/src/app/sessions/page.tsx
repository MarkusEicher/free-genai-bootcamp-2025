'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Session {
  id: string
  type: string
  createdAt: string
  wordCount: number
  successRate: number
  groupName: string
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/sessions')
        if (!response.ok) throw new Error('Failed to fetch sessions')
        const data = await response.json()
        setSessions(data.data)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load sessions')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSessions()
  }, [])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">DATE</div>
          <div className="text-gray-400 font-medium">TYPE</div>
          <div className="text-gray-400 font-medium">GROUP</div>
          <div className="text-gray-400 font-medium">WORDS</div>
          <div className="text-gray-400 font-medium">SUCCESS RATE</div>
        </div>
        {sessions.map((session) => {
          // Create a date object and format it consistently
          const sessionDate = new Date(session.createdAt)
          sessionDate.setSeconds(0, 0)
          const sessionId = encodeURIComponent(sessionDate.toISOString())
          
          return (
            <Link
              key={session.id}
              href={`/sessions/${sessionId}`}
              className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700"
            >
              <div>{new Date(session.createdAt).toLocaleString()}</div>
              <div className="capitalize">{session.type}</div>
              <div>{session.groupName}</div>
              <div>{session.wordCount} words</div>
              <div className={session.successRate >= 70 ? 'text-green-500' : 'text-yellow-500'}>
                {session.successRate}%
              </div>
            </Link>
          )
        })}
        {sessions.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            No study sessions yet. Start studying to see your progress!
          </div>
        )}
      </div>
    </div>
  )
} 