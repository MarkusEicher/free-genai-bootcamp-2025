'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Group } from '@prisma/client'

interface GroupWithCount extends Group {
  _count: {
    words: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch groups')
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
      if (!response.ok) throw new Error(data.error || 'Failed to create group')
      setGroups([...groups, data.data])
      setNewGroupName('')
      setShowCreateForm(false)
    } catch (err) {
      console.error('Error creating group:', err)
      setError('Failed to create group')
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Word Groups</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Group
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <form onSubmit={createGroup} className="space-y-4">
            <div>
              <label htmlFor="groupName" className="block text-sm font-medium mb-1">
                Group Name
              </label>
              <input
                type="text"
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create Group
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4 p-4 border-b dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 font-medium">NAME</div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">WORD COUNT</div>
        </div>

        {groups.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No groups yet. Create one to get started!
          </div>
        ) : (
          groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="grid grid-cols-2 gap-4 p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="text-blue-500 hover:text-blue-600">
                {group.name}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                {group._count.words}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}