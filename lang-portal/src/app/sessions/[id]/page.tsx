'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface SessionDetails {
  id: string
  type: string
  createdAt: string
  groupName: string
  words: Array<{
    text: string
    translation: string
    activities: Array<{
      success: boolean
    }>
  }>
}

export default function SessionDetailsPage() {
  const params = useParams()
  const sessionId = decodeURIComponent(params?.id as string)
  
  const [session, setSession] = useState<SessionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) return
      
      try {
        const encodedId = encodeURIComponent(sessionId)
        const response = await fetch(`/api/sessions/${encodedId}`)
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch session')
        }
        const data = await response.json()
        if (!data.data) {
          throw new Error('No session data received')
        }
        setSession(data.data)
      } catch (err) {
        console.error('Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load session details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Date</div>
          <div className="text-lg">{new Date(session.createdAt).toLocaleString()}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Activity Type</div>
          <div className="text-lg">{session.type}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Group</div>
          <div className="text-lg">{session.groupName}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-gray-400 mb-2">Words Studied</div>
          <div className="text-lg">{session.words.length}</div>
        </div>
      </div>

      <h2 className="text-xl font-bold mb-4">Words Reviewed</h2>
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">GERMAN</div>
          <div className="text-gray-400 font-medium">ENGLISH</div>
          <div className="text-gray-400 font-medium">RESULT</div>
        </div>
        {session.words.map((word, index) => (
          <div key={index} className="grid grid-cols-3 gap-4 p-4 border-b border-gray-700">
            <div>{word.text}</div>
            <div>{word.translation}</div>
            <div className={word.activities[0]?.success ? 'text-green-500' : 'text-red-500'}>
              {word.activities[0]?.success ? 'Correct' : 'Incorrect'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 