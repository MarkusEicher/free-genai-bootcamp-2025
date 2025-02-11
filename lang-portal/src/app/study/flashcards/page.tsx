'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  wordCount: number
}

export default function FlashcardsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('/api/groups')
        if (!response.ok) throw new Error('Failed to fetch groups')
        const data = await response.json()
        setGroups(data.data)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load groups')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Select Word Group</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">{group.name}</h2>
            <p className="text-gray-400 mb-4">{group.wordCount} words</p>
            <Link
              href={`/study/flashcards/launch?groupId=${group.id}`}
              className="block text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Start Flashcards
            </Link>
          </div>
        ))}
        {groups.length === 0 && (
          <div className="col-span-full text-center text-gray-400">
            No study groups available. Create a group to start studying!
          </div>
        )}
      </div>
    </div>
  )
} 