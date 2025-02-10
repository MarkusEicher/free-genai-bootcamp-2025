'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Word {
  text: string
  translation: string
  group?: {
    name: string
  } | null
}

interface Activity {
  id: string
  type: string
  wordId: string
  success: boolean
  createdAt: string
  word: Word | null
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities')
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()
        setActivities(data.data)
      } catch (err) {
        setError('Failed to load activities')
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Activities</h1>
        <Link 
          href="/study" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start New Study Session
        </Link>
      </div>
      <div className="space-y-4">
        {activities.map((activity: Activity) => (
          <div key={activity.id} className="p-4 bg-gray-800 rounded-lg">
            <div className="flex justify-between">
              <div>
                <span className="text-lg">{activity.word?.text || 'Unknown'}</span>
                <span className="mx-2">→</span>
                <span>{activity.word?.translation || 'Unknown'}</span>
              </div>
              <div className={activity.success ? 'text-green-500' : 'text-red-500'}>
                {activity.success ? '✓' : '✗'}
              </div>
            </div>
            <div className="text-sm text-gray-400 mt-2">
              {new Date(activity.createdAt).toLocaleString()}
              {activity.word?.group && ` • ${activity.word.group.name}`}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 