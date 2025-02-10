'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import type { Word, Group, Activity } from '@prisma/client'

interface WordDetails extends Word {
  group: Group | null
  activities: Activity[]
}

interface StudyStats {
  correct: number
  wrong: number
}

export default function WordDetailsPage() {
  const params = useParams()
  const [word, setWord] = useState<WordDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWordDetails()
  }, [params.id])

  const fetchWordDetails = async () => {
    try {
      const response = await fetch(`/api/words/${params.id}`)
      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch word details')
      setWord(data.data)
    } catch (err) {
      console.error('Error fetching word details:', err)
      setError('Failed to load word details')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Word Details</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !word) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Word Details</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Word not found'}
        </div>
      </div>
    )
  }

  const stats: StudyStats = word.activities.reduce(
    (acc, activity) => {
      if (activity.success) {
        acc.correct++
      } else {
        acc.wrong++
      }
      return acc
    },
    { correct: 0, wrong: 0 }
  )

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Word Details</h1>
        <Link
          href="/words"
          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 px-4 py-2 rounded"
        >
          Back to Words
        </Link>
      </div>

      {/* Word Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">German</h2>
          <p className="text-3xl">{word.text}</p>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">English</h2>
          <p className="text-3xl">{word.translation}</p>
        </div>
      </div>

      {/* Study Statistics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Study Statistics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-gray-600 dark:text-gray-400">Correct Answers</h3>
            <p className="text-3xl font-bold text-green-500">{stats.correct}</p>
          </div>
          <div>
            <h3 className="text-gray-600 dark:text-gray-400">Wrong Answers</h3>
            <p className="text-3xl font-bold text-red-500">{stats.wrong}</p>
          </div>
        </div>
      </div>

      {/* Word Groups */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Word Groups</h2>
        {word.group ? (
          <div className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded">
            {word.group.name}
          </div>
        ) : (
          <p className="text-gray-500">No groups assigned</p>
        )}
      </div>
    </div>
  )
} 