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
  const [sessions, setSessions] = useState<Session[]>([])

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions')
      const data = await response.json()
      setSessions(data.data)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Study Sessions</h1>

      <div className="space-y-6">
        {sessions.map((session) => (
          <div key={session.date} className="bg-white rounded-lg shadow p-4">
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
                    activity.success ? 'bg-green-50' : 'bg-red-50'
                  }`}
                >
                  <p>
                    {activity.word.text} ({activity.word.translation})
                    {activity.word.group && (
                      <span className="text-sm text-gray-500 ml-2">
                        Group: {activity.word.group.name}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(activity.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <p className="text-gray-500 text-center mt-8">
          No study sessions yet. Start practicing to see your history!
        </p>
      )}
    </div>
  )
} 