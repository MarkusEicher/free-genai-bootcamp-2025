'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Word, Group } from '@prisma/client'

interface WordWithGroup extends Word {
  group: Group | null
}

export default function WordsPage() {
  const [words, setWords] = useState<WordWithGroup[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [newWord, setNewWord] = useState({ text: '', translation: '', groupId: '' })
  const [editingWord, setEditingWord] = useState<WordWithGroup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetchWords(),
      fetchGroups()
    ])
  }, [])

  const fetchWords = async () => {
    try {
      const response = await fetch('/api/words')
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to fetch words')
      setWords(data.data)
    } catch (err) {
      console.error('Error fetching words:', err)
      setError('Failed to load words')
    }
  }

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

  const addWord = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWord)
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to add word')
      setWords([data.data, ...words])
      setNewWord({ text: '', translation: '', groupId: '' })
    } catch (err) {
      console.error('Error adding word:', err)
      setError('Failed to add word')
    }
  }

  const updateWord = async (wordId: string, updates: Partial<WordWithGroup>) => {
    try {
      const response = await fetch(`/api/words/${wordId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: updates.text,
          translation: updates.translation,
          groupId: updates.groupId
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update word')
      }

      const data = await response.json()
      
      setWords(words.map(word => 
        word.id === wordId 
          ? { ...word, ...data.data }
          : word
      ))
      setEditingWord(null)
    } catch (err) {
      console.error('Error updating word:', err)
      setError(err instanceof Error ? err.message : 'Failed to update word')
    }
  }

  const deleteWord = async (wordId: string) => {
    if (!confirm('Are you sure you want to delete this word?')) return

    try {
      const response = await fetch(`/api/words/${wordId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete word')
      }
      setWords(words.filter(word => word.id !== wordId))
    } catch (err) {
      console.error('Error deleting word:', err)
      setError('Failed to delete word')
    }
  }

  if (isLoading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-500">{error}</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Words</h1>

      {/* Add Word Form */}
      <form onSubmit={addWord} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Word</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={newWord.text}
            onChange={(e) => setNewWord({ ...newWord, text: e.target.value })}
            placeholder="Word"
            className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <input
            type="text"
            value={newWord.translation}
            onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
            placeholder="Translation"
            className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
            required
          />
          <select
            value={newWord.groupId}
            onChange={(e) => setNewWord({ ...newWord, groupId: e.target.value })}
            className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">No Group</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="md:col-span-3 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Word
          </button>
        </div>
      </form>

      {/* Words List */}
      <div className="space-y-4">
        {words.length === 0 ? (
          <p className="text-center text-gray-500">No words yet. Add some to get started!</p>
        ) : (
          words.map((word) => (
            <div
              key={word.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4"
            >
              {editingWord?.id === word.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={editingWord.text}
                      onChange={(e) => setEditingWord({ ...editingWord, text: e.target.value })}
                      className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <input
                      type="text"
                      value={editingWord.translation}
                      onChange={(e) => setEditingWord({ ...editingWord, translation: e.target.value })}
                      className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
                    />
                    <select
                      value={editingWord.groupId || ''}
                      onChange={(e) => setEditingWord({ ...editingWord, groupId: e.target.value || null })}
                      className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600"
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
                      onClick={() => updateWord(word.id, editingWord)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingWord(null)}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <Link 
                      href={`/words/${word.id}`}
                      className="font-medium hover:text-blue-500"
                    >
                      {word.text}
                    </Link>
                    <p className="text-gray-500">{word.translation}</p>
                    <p className="text-sm text-gray-500">
                      {word.group ? `Group: ${word.group.name}` : 'No Group'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingWord(word)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteWord(word.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
} 