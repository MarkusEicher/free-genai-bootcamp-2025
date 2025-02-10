'use client'

import { useState, useEffect } from 'react'
import type { Activity, Word, Group } from '@prisma/client'

type SessionActivity = Activity & {
  word: Word & {
    group: Group | null
  }
}

interface Session {
  date: string
  activities: SessionActivity[]
  stats: {
    total: number
    correct: number
    wrong: number
  }
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/sessions')
      if (!response.ok) {
        throw new Error('Failed to fetch sessions')
      }
      const data = await response.json()
      setSessions(data.data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
      setError('Failed to load sessions')
      setSessions([])
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-24 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>
        <p className="text-gray-500 text-center mt-8">
          No study sessions yet. Start practicing to see your history!
        </p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>
      <div className="space-y-6">
        {sessions.map((session) => (
          <div key={session.date} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {new Date(session.date).toLocaleDateString()}
              </h2>
              <div className="text-sm">
                <span className="text-green-500 mr-3">
                  ✓ {session.stats.correct} correct
                </span>
                <span className="text-red-500">
                  ✗ {session.stats.wrong} wrong
                </span>
              </div>
            </div>

            <div className="space-y-2">
              {session.activities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`p-2 rounded ${
                    activity.success 
                      ? 'bg-green-50 dark:bg-green-900/50' 
                      : 'bg-red-50 dark:bg-red-900/50'
                  }`}
                >
                  <p>
                    {activity.word.text} ({activity.word.translation})
                    {activity.word.group && (
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        Group: {activity.word.group.name}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 