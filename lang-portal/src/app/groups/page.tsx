'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  _count: {
    words: number
  }
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [noGroupCount, setNoGroupCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsResponse, noGroupResponse] = await Promise.all([
          fetch('/api/groups'),
          fetch('/api/words/no-group')
        ])

        if (!groupsResponse.ok || !noGroupResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const groupsData = await groupsResponse.json()
        const noGroupData = await noGroupResponse.json()

        setGroups(groupsData.data)
        setNoGroupCount(noGroupData.data._count)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Word Groups</h1>
        <Link 
          href="/groups/new" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Create New Group
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg shadow">
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">NAME</div>
          <div className="text-gray-400 font-medium">WORD COUNT</div>
        </div>

        <Link
          href="/words/no-group"
          className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700"
        >
          <div className="text-blue-400">No Group</div>
          <div className="text-gray-400">{noGroupCount}</div>
        </Link>

        {groups.map((group) => (
          <Link
            key={group.id}
            href={`/groups/${group.id}`}
            className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700"
          >
            <div className="text-blue-400">{group.name}</div>
            <div className="text-gray-400">{group._count.words}</div>
          </Link>
        ))}

        {groups.length === 0 && !noGroupCount && (
          <div className="p-4 text-center text-gray-400">
            No groups created yet. Create your first group to get started!
          </div>
        )}
      </div>
    </div>
  )
}