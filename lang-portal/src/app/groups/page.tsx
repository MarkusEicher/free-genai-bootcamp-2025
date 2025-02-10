'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Group, Word } from '@prisma/client'

interface GroupWithWords extends Group {
  words: Word[]
  _count: {
    words: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithWords[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/groups')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch groups')
      }

      setGroups(data.data)
    } catch (err) {
      console.error('Error fetching groups:', err)
      setError('Failed to load groups')
    } finally {
      setIsLoading(false)
    }
  }

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create group')
      }

      setGroups([...groups, data.data])
      setNewGroupName('')
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group')
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Word Groups</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-6">Word Groups</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Word Groups</h1>

      {/* Create Group Form */}
      <form onSubmit={createGroup} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Enter group name"
            className="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Group
          </button>
        </div>
      </form>

      {/* Groups List */}
      <div className="space-y-4">
        {groups.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            No groups yet. Create one to get started!
          </p>
        ) : (
          groups.map((group) => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">{group.name}</h2>
                  <p className="text-sm text-gray-500">
                    {group._count.words} words
                  </p>
                </div>
                <Link
                  href={`/groups/${group.id}`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 