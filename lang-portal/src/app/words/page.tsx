'use client'

import { useState } from 'react'

export default function WordsPage() {
  const [word, setWord] = useState({ text: '', translation: '' })
  const [message, setMessage] = useState('')

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
      setWord({ text: '', translation: '' })
      console.log('Response:', data)
    } catch (error) {
      setMessage('Error creating word')
      console.error('Error:', error)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Word</h1>
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
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Word
        </button>
      </form>
      {message && (
        <p className="mt-4 text-green-600">{message}</p>
      )}
    </div>
  )
} 