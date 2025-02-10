'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface SessionDetails {
  activity: {
    type: string
    group: string
  }
  startTime: string
  reviewItems: number
  words: {
    kanji: string
    romaji: string
    english: string
    correct: number
    wrong: number
  }[]
}

export default function SessionDetailsPage({ params }: { params: { id: string } }) {
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/sessions/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch session')
        const data = await response.json()
        setSession(data.data)
      } catch (err) {
        setError('Failed to load session details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [params.id])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!session) return <div className="p-4">Session not found</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Study Session Details</h1>
        <Link
          href="/sessions"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Back to Sessions
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Activity</div>
          <div className="text-lg">{session.activity.type}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Group</div>
          <div className="text-lg">{session.activity.group}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Start Time</div>
          <div className="text-lg">{new Date(session.startTime).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Review Items</div>
          <div className="text-lg">{session.reviewItems}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Words Reviewed</h2>
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">KANJI</div>
          <div className="text-gray-400 font-medium">ROMAJI</div>
          <div className="text-gray-400 font-medium">ENGLISH</div>
          <div className="text-gray-400 font-medium">CORRECT</div>
          <div className="text-gray-400 font-medium">WRONG</div>
        </div>
        {session.words.map((word, index) => (
          <div key={index} className="grid grid-cols-5 gap-4 p-4 border-b border-gray-700">
            <div className="text-blue-400">{word.kanji}</div>
            <div>{word.romaji}</div>
            <div>{word.english}</div>
            <div className="text-green-500">{word.correct}</div>
            <div className="text-red-500">{word.wrong}</div>
          </div>
        ))}
      </div>
    </div>
  )
} 