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

export default function ActivitiesPage() {
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
        setError('Failed to load activities')
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Learning Activities</h1>
        <Link
          href="/study"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Learning
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">DATE</div>
          <div className="text-gray-400 font-medium">TYPE</div>
          <div className="text-gray-400 font-medium">GROUP</div>
          <div className="text-gray-400 font-medium">WORDS</div>
          <div className="text-gray-400 font-medium">SUCCESS RATE</div>
        </div>
        {sessions.map((session) => {
          const sessionId = encodeURIComponent(session.id)
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
            No learning activities yet. Start studying to track your progress!
          </div>
        )}
      </div>

      <div className="mt-8 bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Activity Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Flashcards</h3>
            <p className="text-gray-400">
              Practice your vocabulary with interactive flashcards. Test your knowledge of German words and their English translations.
            </p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Group Study</h3>
            <p className="text-gray-400">
              Study words organized by groups. Focus on specific categories or themes to improve your vocabulary.
            </p>
          </div>
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-400">
              Monitor your learning progress with detailed statistics and success rates for each study session.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 