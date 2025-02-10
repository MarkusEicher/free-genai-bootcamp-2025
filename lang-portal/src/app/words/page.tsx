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
      if (!response.ok) throw new Error('Failed to fetch words')
      const data = await response.json()
      setWords(data.data)
      setIsLoading(false)
    } catch (err) {
      console.error('Error:', err)
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
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newWord),
      })

      if (!response.ok) throw new Error('Failed to create word')
      
      setNewWord({ text: '', translation: '', groupId: '' })
      fetchWords()
    } catch (err) {
      console.error('Error:', err)
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
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Words</h1>

      <form onSubmit={handleSubmit} className="mb-8 bg-gray-800 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="translation" className="block text-gray-400 mb-2">
              English
            </label>
            <input
              id="translation"
              type="text"
              value={newWord.translation}
              onChange={(e) => setNewWord({ ...newWord, translation: e.target.value })}
              placeholder="English word"
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="text" className="block text-gray-400 mb-2">
              German
            </label>
            <input
              id="text"
              type="text"
              value={newWord.text}
              onChange={(e) => setNewWord({ ...newWord, text: e.target.value })}
              placeholder="German translation"
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 text-white"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Word
        </button>
      </form>

      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700">
          <div className="text-gray-400 font-medium">ENGLISH</div>
          <div className="text-gray-400 font-medium">GERMAN</div>
        </div>
        {words.map((word) => (
          <Link
            key={word.id}
            href={`/words/${word.id}`}
            className="grid grid-cols-2 gap-4 p-4 border-b border-gray-700 hover:bg-gray-700"
          >
            <div>{word.translation}</div>
            <div>{word.text}</div>
          </Link>
        ))}
        {words.length === 0 && (
          <div className="p-4 text-center text-gray-400">
            No words added yet. Add your first word above!
          </div>
        )}
      </div>
    </div>
  )
} 