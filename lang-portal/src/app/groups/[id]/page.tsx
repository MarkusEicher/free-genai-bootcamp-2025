'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Word, Group } from '@prisma/client'

interface WordWithGroup extends Word {
  group: Group | null
}

interface GroupWithWords extends Group {
  words: Word[]
  _count: {
    words: number
  }
}

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [group, setGroup] = useState<GroupWithWords | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')

  useEffect(() => {
    fetchGroupDetails()
  }, [params.id])

  const fetchGroupDetails = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch group')
      setGroup(data.data)
      setEditedName(data.data.name)
    } catch (err) {
      console.error('Error fetching group:', err)
      setError('Failed to load group')
    } finally {
      setIsLoading(false)
    }
  }

  const updateGroup = async () => {
    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedName })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update group')
      setGroup(data.data)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating group:', err)
      setError('Failed to update group')
    }
  }

  const deleteGroup = async () => {
    if (!confirm('Are you sure? This will remove the group from all associated words.')) return

    try {
      const response = await fetch(`/api/groups/${params.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete group')
      }
      router.push('/groups')
    } catch (err) {
      console.error('Error deleting group:', err)
      setError('Failed to delete group')
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>
  if (!group) return <div className="p-4">Group not found</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/groups"
            className="text-gray-500 hover:text-gray-600"
          >
            ← Back to Groups
          </Link>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="border p-1 rounded"
              />
              <button
                onClick={updateGroup}
                className="text-green-500 hover:text-green-600"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-500 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          ) : (
            <h1 className="text-2xl font-bold">{group.name}</h1>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="text-blue-500 hover:text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={deleteGroup}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Words List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4 p-4 border-b dark:border-gray-700">
          <div className="text-gray-600 dark:text-gray-400 font-medium">WORD</div>
          <div className="text-gray-600 dark:text-gray-400 font-medium">TRANSLATION</div>
        </div>

        {group.words.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No words in this group yet
          </div>
        ) : (
          group.words.map((word) => (
            <div
              key={word.id}
              className="grid grid-cols-2 gap-4 p-4 border-b dark:border-gray-700"
            >
              <div>{word.text}</div>
              <div>{word.translation}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 