'use client'

import { useState, useEffect } from 'react'
import type { Group } from '@prisma/client'

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [newGroup, setNewGroup] = useState({ name: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      setGroups(data.data)
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroup),
      })
      const data = await response.json()
      setMessage('Group created successfully!')
      setNewGroup({ name: '' })
      fetchGroups()
    } catch (error) {
      setMessage('Error creating group')
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Groups Management</h1>
      
      {/* Create Group Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="block mb-2">
            Group Name:
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) => setNewGroup({ name: e.target.value })}
              className="border p-2 w-full"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Group
        </button>
      </form>

      {message && (
        <p className="my-4 text-green-600">{message}</p>
      )}

      {/* Groups List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Groups</h2>
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="border p-4 rounded shadow"
            >
              <h3 className="font-medium">{group.name}</h3>
              <p className="text-sm text-gray-500">
                Created: {new Date(group.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 