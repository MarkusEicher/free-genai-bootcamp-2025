'use client'

import { useState, useEffect } from 'react'
import type { Word, Group } from '@prisma/client'

interface WordFormProps {
  word?: Word
  onSubmit: (data: { text: string; translation: string; groupId: string | null }) => Promise<void>
  onCancel: () => void
}

export default function WordForm({ word, onSubmit, onCancel }: WordFormProps) {
  const [text, setText] = useState(word?.text || '')
  const [translation, setTranslation] = useState(word?.translation || '')
  const [groupId, setGroupId] = useState(word?.groupId || '')
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setGroups(data.data)
    } catch (err) {
      console.error('Error fetching groups:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({ 
      text, 
      translation, 
      groupId: groupId || null 
    })
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="text" className="block text-sm font-medium mb-1">
          Word
        </label>
        <input
          type="text"
          id="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label htmlFor="translation" className="block text-sm font-medium mb-1">
          Translation
        </label>
        <input
          type="text"
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
          required
        />
      </div>

      <div>
        <label htmlFor="group" className="block text-sm font-medium mb-1">
          Group
        </label>
        <select
          id="group"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="">No Group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {word ? 'Update' : 'Create'} Word
        </button>
      </div>
    </form>
  )
} 