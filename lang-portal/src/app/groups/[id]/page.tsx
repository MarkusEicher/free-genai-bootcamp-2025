'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Group {
  id: string
  name: string
  words: Array<{
    id: string
    text: string
    translation: string
  }>
}

export default function GroupDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const groupId = params?.id as string
  
  const [group, setGroup] = useState<Group | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (!groupId || groupId === 'new') return
      
      try {
        const response = await fetch(`/api/groups/${groupId}`)
        if (!response.ok) throw new Error('Failed to fetch group')
        const data = await response.json()
        
        if (!data.data) {
          throw new Error('Group not found')
        }
        
        setGroup(data.data)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load group details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupDetails()
  }, [groupId])

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!group) return <div className="p-4">Group not found</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Link
          href="/groups"
          className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
        >
          Back to Groups
        </Link>
      </div>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">WORD</div>
          <div className="text-gray-400 font-medium">TRANSLATION</div>
        </div>
        {group.words.map((word) => (
          <Link
            key={word.id}
            href={`/words/${word.id}`}
            className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700"
          >
            <div>{word.text}</div>
            <div>{word.translation}</div>
          </Link>
        ))}
        {group.words.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            No words in this group yet.
          </div>
        )}
      </div>
    </div>
  )
} 