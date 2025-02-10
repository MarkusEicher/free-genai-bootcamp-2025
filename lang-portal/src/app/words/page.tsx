'use client'

import { useState, useEffect } from 'react'
import type { Word, Group } from '@prisma/client'

type WordWithGroup = Word & {
  group: Group | null
}

export default function WordsPage() {
  const [word, setWord] = useState({ text: '', translation: '', groupId: '' })
  const [words, setWords] = useState<WordWithGroup[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchWords()
    fetchGroups()
  }, [])

  const fetchWords = async () => {
    try {
      const response = await fetch('/api/words')
      const data = await response.json()
      setWords(data.data)
    } catch (error) {
      console.error('Error fetching words:', error)
    }
  }

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
      const response = await fetch('/api/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(word),
      })
      const data = await response.json()
      setMessage('Word created successfully!')
      setWord({ text: '', translation: '', groupId: '' })
      fetchWords()
    } catch (error) {
      setMessage('Error creating word')
      console.error('Error:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/words/${id}`, {
        method: 'DELETE',
      })
      setMessage('Word deleted successfully!')
      fetchWords()
    } catch (error) {
      setMessage('Error deleting word')
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Words Management</h1>
      
      {/* Create Word Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">
            Word:
            <input
              type="text"
              value={word.text}
              onChange={(e) => setWord({ ...word, text: e.target.value })}
              className="border p-2 w-full"
              required
            />
          </label>
        </div>
        <div>
          <label className="block mb-2">
            Translation:
            <input
              type="text"
              value={word.translation}
              onChange={(e) => setWord({ ...word, translation: e.target.value })}
              className="border p-2 w-full"
              required
            />
          </label>
        </div>
        <div>
          <label className="block mb-2">
            Group:
            <select
              value={word.groupId}
              onChange={(e) => setWord({ ...word, groupId: e.target.value })}
              className="border p-2 w-full"
            >
              <option value="">No Group</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Word
        </button>
      </form>

      {message && (
        <p className="my-4 text-green-600">{message}</p>
      )}

      {/* Words List */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Existing Words</h2>
        <div className="space-y-4">
          {words.map((word) => (
            <div
              key={word.id}
              className="border p-4 rounded shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium">{word.text}</h3>
                <p className="text-gray-600">{word.translation}</p>
                {word.group && (
                  <p className="text-sm text-gray-500">
                    Group: {word.group.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDelete(word.id)}
                className="text-red-500 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 