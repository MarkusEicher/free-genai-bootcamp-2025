'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Word {
  id: string
  text: string
  translation: string
  group?: {
    id: string
    name: string
  }
}

interface Activity {
  id: string
  success: boolean
  createdAt: string
}

interface WordStats {
  word: Word
  activities: Activity[]
  successRate: number
  totalAttempts: number
}

export default function WordDetailsPage() {
  const params = useParams()
  const wordId = params?.id as string
  
  const [wordStats, setWordStats] = useState<WordStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchWordDetails = async () => {
      if (!wordId) return

      try {
        const response = await fetch(`/api/words/${wordId}`)
        if (!response.ok) throw new Error('Failed to fetch word details')
        const data = await response.json()
        
        if (data.data) {
          const activities = data.data.activities || []
          const totalAttempts = activities.length
          const successfulAttempts = activities.filter((a: Activity) => a.success).length
          const successRate = totalAttempts > 0 
            ? Math.round((successfulAttempts / totalAttempts) * 100) 
            : 0

          setWordStats({
            word: {
              id: data.data.id,
              text: data.data.text,
              translation: data.data.translation,
              group: data.data.group
            },
            activities: activities,
            successRate,
            totalAttempts
          })
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load word details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchWordDetails()
  }, [wordId])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!wordStats) return <div className="p-4">Word not found</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Word Details</h1>
        <Link
          href="/words"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Back to Words
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">German</div>
          <div className="text-2xl">{wordStats.word.text}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">English</div>
          <div className="text-2xl">{wordStats.word.translation}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Group</div>
          <div className="text-lg">
            {wordStats.word.group ? (
              <Link 
                href={`/groups/${wordStats.word.group.id}`}
                className="text-blue-400 hover:text-blue-300"
              >
                {wordStats.word.group.name}
              </Link>
            ) : (
              <span className="text-gray-500">No Group</span>
            )}
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Success Rate</div>
          <div className="text-lg">
            <span className={wordStats.successRate >= 70 ? 'text-green-500' : 'text-yellow-500'}>
              {wordStats.successRate}%
            </span>
            <span className="text-gray-400 text-sm ml-2">
              ({wordStats.totalAttempts} attempts)
            </span>
          </div>
        </div>
      </div>

      {wordStats.activities.length > 0 && (
        <>
          <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700">
              <div className="text-gray-400 font-medium">DATE</div>
              <div className="text-gray-400 font-medium">RESULT</div>
            </div>
            {wordStats.activities.slice(0, 10).map((activity) => (
              <div key={activity.id} className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700">
                <div>{new Date(activity.createdAt).toLocaleString()}</div>
                <div className={activity.success ? 'text-green-500' : 'text-red-500'}>
                  {activity.success ? 'Correct' : 'Incorrect'}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
} 